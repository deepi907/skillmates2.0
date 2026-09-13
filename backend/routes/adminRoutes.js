const express = require("express");
const pool = require("../db");

const router = express.Router();


// ==========================================
// ADMIN DASHBOARD STATS
// ==========================================

router.get("/stats", async (req, res) => {
  try {
    const usersResult = await pool.query(
      "SELECT COUNT(*)::int AS count FROM users"
    );

    const membersResult = await pool.query(
      "SELECT COUNT(*)::int AS count FROM users"
    );

    const matchesResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM connections
       WHERE status = 'accepted'`
    );

    const messagesResult = await pool.query(
      "SELECT COUNT(*)::int AS count FROM messages"
    );

    res.json({
      users: usersResult.rows[0].count,
      members: membersResult.rows[0].count,
      matches: matchesResult.rows[0].count,
      messages: messagesResult.rows[0].count,
    });

  } catch (error) {
    console.error(
      "Admin stats error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch admin statistics",
    });
  }
});


// ==========================================
// ADMIN MATCHES
// ==========================================

router.get("/matches", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.status,
        c.created_at,

        sender.id AS sender_id,
        sender.name AS sender_name,

        receiver.id AS receiver_id,
        receiver.name AS receiver_name

      FROM connections c

      JOIN users sender
        ON sender.id = c.sender_id

      JOIN users receiver
        ON receiver.id = c.receiver_id

      WHERE c.status = 'accepted'

      ORDER BY c.created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(
      "Admin matches error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch matches",
    });
  }
});


// ==========================================
// ADMIN MESSAGES
// ==========================================

router.get("/messages", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id,
        m.sender_id,
        m.receiver_id,
        m.message,
        m.is_read,
        m.created_at,

        sender.name AS sender_name,
        receiver.name AS receiver_name

      FROM messages m

      JOIN users sender
        ON sender.id = m.sender_id

      JOIN users receiver
        ON receiver.id = m.receiver_id

      ORDER BY m.created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(
      "Admin messages error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch messages",
    });
  }
});


// ==========================================
// DEBUG DATABASE / MESSAGES
// ==========================================
// Temporary route to verify which
// PostgreSQL database the backend uses.
// ==========================================

router.get(
  "/debug-messages",
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          current_database() AS database,
          current_user AS user,
          COUNT(*)::int AS message_count
        FROM messages
      `);

      res.json(result.rows[0]);

    } catch (error) {
      console.error(
        "Debug messages error:",
        error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// ==========================================
// DELETE USER
// ==========================================

router.delete("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const result = await pool.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id, name, email`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "User deleted successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Admin delete user error:",
      error
    );

    res.status(500).json({
      message: "Failed to delete user",
    });
  }
});
// ==========================================
// EXPORT
// ==========================================

module.exports = router;
