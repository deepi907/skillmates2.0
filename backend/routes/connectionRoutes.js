const express = require("express");
const pool = require("../db");

const router = express.Router();

// ==========================================
// SEND CONNECTION REQUEST
// ==========================================
router.get("/test", (req, res) => {
  res.json({
    message: "Connection routes are working!"
  });
});
router.post("/", async (req, res) => {
      console.log("🔥 POST /api/connections HIT");
  console.log("📦 Request body:", req.body);

  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({
        message: "Sender and receiver are required",
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        message: "You cannot connect with yourself",
      });
    }

    const existing = await pool.query(
      `SELECT id
       FROM connections
       WHERE sender_id = $1
       AND receiver_id = $2`,
      [senderId, receiverId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "Connection request already sent",
      });
    }

    const result = await pool.query(
      `INSERT INTO connections
       (sender_id, receiver_id)
       VALUES ($1, $2)
       RETURNING *`,
      [senderId, receiverId]
    );

    res.status(201).json({
      message: "Connection request sent",
      connection: result.rows[0],
    });

  } catch (error) {
    console.error("Connection error:", error);

    res.status(500).json({
      message: "Failed to send connection request",
    });
  }
});


// ==========================================
// GET CONNECTION REQUESTS
// ==========================================

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT
        c.id,
        c.status,
        c.created_at,
        u.id AS sender_id,
        u.name AS sender_name,
        u.email AS sender_email,
        u.bio AS sender_bio,
        u.skills AS sender_skills,
        u.learning AS sender_learning,
        u.profile_picture AS sender_profile_picture
       FROM connections c
       JOIN users u ON c.sender_id = u.id
       WHERE c.receiver_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching connections:", error);

    res.status(500).json({
      message: "Failed to fetch connection requests",
    });
  }
});


// ==========================================
// ACCEPT / REJECT CONNECTION
// ==========================================

router.patch("/:connectionId", async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid connection status",
      });
    }

    const result = await pool.query(
      `UPDATE connections
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, connectionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Connection request not found",
      });
    }

 const updatedConnection =
  result.rows[0];

const io = req.app.get("io");

if (io) {
  io.to("admin_room").emit(
    "admin-match-updated",
    updatedConnection
  );
}

res.json({
  message: `Connection request ${status}`,
  connection: updatedConnection,
});
  } catch (error) {
    console.error("Error updating connection:", error);

    res.status(500).json({
      message: "Failed to update connection",
    });
  }
});


// ==========================================
// GET ACCEPTED SKILLMATES
// ==========================================

router.get("/:userId/accepted", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT
        c.id AS connection_id,
        c.status,
        c.created_at,

        CASE
          WHEN c.sender_id = $1 THEN receiver.id
          ELSE sender.id
        END AS user_id,

        CASE
          WHEN c.sender_id = $1 THEN receiver.name
          ELSE sender.name
        END AS name,

        CASE
          WHEN c.sender_id = $1 THEN receiver.email
          ELSE sender.email
        END AS email,

        CASE
          WHEN c.sender_id = $1 THEN receiver.bio
          ELSE sender.bio
        END AS bio,

        CASE
          WHEN c.sender_id = $1 THEN receiver.skills
          ELSE sender.skills
        END AS skills,

        CASE
          WHEN c.sender_id = $1 THEN receiver.learning
          ELSE sender.learning
        END AS learning
        CASE
  WHEN c.sender_id = $1 THEN receiver.profile_picture
  ELSE sender.profile_picture
END AS profile_picture
      FROM connections c

      JOIN users sender
        ON sender.id = c.sender_id

      JOIN users receiver
        ON receiver.id = c.receiver_id

      WHERE
        (c.sender_id = $1 OR c.receiver_id = $1)
        AND c.status = 'accepted'

      ORDER BY c.created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(
      "Error fetching accepted SkillMates:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch SkillMates",
    });
  }
});

module.exports = router;