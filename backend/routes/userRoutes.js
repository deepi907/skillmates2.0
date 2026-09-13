const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../db");

const router = express.Router();

console.log("USER ROUTES LOADED");


// ==========================================
// PROFILE IMAGE UPLOAD SETUP
// ==========================================

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const filename =
      `profile-${req.params.id}-${Date.now()}${extension}`;

    cb(null, filename);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only image files are allowed"
        )
      );
    }
  },
});

// ==========================================
// INTEREST MEDIA UPLOAD SETUP
// ==========================================

const interestStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const filename =
      `interest-${req.params.id}-${Date.now()}${extension}`;

    cb(null, filename);
  },
});

const interestUpload = multer({
  storage: interestStorage,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/",
      "audio/",
      "video/",
      "application/pdf",
      "text/",
    ];

    const allowed = allowedTypes.some((type) =>
      type.endsWith("/")
        ? file.mimetype.startsWith(type)
        : file.mimetype === type
    );

    if (allowed) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "This file type is not supported."
        )
      );
    }
  },
});

// ==========================================
// DELETE INTEREST MEDIA
// ==========================================

router.delete(
  "/:id/interest-media",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { interest } = req.body;

      if (!interest) {
        return res.status(400).json({
          message: "Interest is required",
        });
      }

      const userResult = await pool.query(
        `SELECT interest_media
         FROM users
         WHERE id = $1`,
        [id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const currentMedia =
        userResult.rows[0].interest_media || {};

      const media = currentMedia[interest];

      if (!media) {
        return res.status(404).json({
          message: "No uploaded media found for this interest",
        });
      }

      // Delete physical file
      if (media.url) {
        const filePath = path.join(
          __dirname,
          "..",
          media.url.replace("/uploads/", "uploads/")
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Remove this interest from JSONB
      const updatedMedia = {
        ...currentMedia,
      };

      delete updatedMedia[interest];

      const result = await pool.query(
        `UPDATE users
         SET interest_media = $1
         WHERE id = $2
         RETURNING id, name, skills, interest_media`,
        [
          updatedMedia,
          id,
        ]
      );

      res.json({
        message: "Interest media deleted successfully",
        user: result.rows[0],
      });

    } catch (error) {
      console.error(
        "DELETE INTEREST MEDIA ERROR:",
        error
      );

      res.status(500).json({
        message: "Failed to delete interest media",
      });
    }
  }
);

// ==========================================
// GET ALL USERS
// ==========================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        name,
        email,
        bio,
        skills,
        learning,
        location,
        city,
        country,
        latitude,
        longitude,
        profile_picture,
          interest_media,
          interest_gallery_privacy,
        created_at
       FROM users
       ORDER BY id`
    );

    res.json(result.rows);

  } catch (error) {
    console.error(
      "Error fetching users:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
});


// ==========================================
// TEST USER ROUTE
// ==========================================

router.get("/test", (req, res) => {
  res.json({
    message: "User routes are working!",
  });
});


// ==========================================
// GET ONE USER BY ID
// ==========================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log(
      "Fetching user ID:",
      id
    );

    const result = await pool.query(
      `SELECT
        id,
        name,
        email,
        bio,
        skills,
        learning,
        location,
        city,
        country,
        latitude,
        longitude,
        profile_picture,
          interest_media,
          interest_gallery_visibility,
interest_gallery_allowed_connections,
    interest_gallery_privacy,
        created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

if (result.rows.length === 0) {
  return res.status(404).json({
    message: "User not found",
  });
}

const user = result.rows[0];

const viewerId = req.query.viewerId
  ? Number(req.query.viewerId)
  : null;

const privacySettings =
  user.interest_gallery_privacy || {};

const interestMedia =
  user.interest_media || {};

const filteredInterestMedia = {};

if (viewerId === user.id) {
  Object.assign(
    filteredInterestMedia,
    interestMedia
  );
}

else {
  for (const [interest, media] of Object.entries(
    interestMedia
  )) {
    const privacy =
      privacySettings[interest] || "everyone";

    if (privacy === "everyone") {
      filteredInterestMedia[interest] = media;
    }

    else if (
      privacy === "connections" &&
      viewerId
    ) {
      const connectionResult =
        await pool.query(
          `
          SELECT id
          FROM connections
          WHERE
            (
              (sender_id = $1 AND receiver_id = $2)
              OR
              (sender_id = $2 AND receiver_id = $1)
            )
            AND status = 'accepted'
          LIMIT 1
          `,
          [user.id, viewerId]
        );

      if (connectionResult.rows.length > 0) {
        filteredInterestMedia[interest] = media;
      }
    }

    else if (privacy === "only_me") {
      // Do not add this interest
    }

    else if (privacy === "selected") {
      // Selected Connections will be added later
    }
  }
}

user.interest_media =
  filteredInterestMedia;

if (viewerId !== user.id) {
  delete user.interest_gallery_allowed_connections;
}
// My Connections

res.json(user);
  } catch (error) {
    console.error(
      "Error fetching user:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch user",
    });
  }
});


// ==========================================
// CREATE NEW USER
// ==========================================

router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      bio,
      skills,
      learning,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    // Check existing email
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users
       (
         name,
         email,
         password,
         bio,
         skills,
         learning
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         name,
         email,
         bio,
         skills,
         learning,
         location,
         profile_picture,
         created_at`,
      [
        name,
        email,
        hashedPassword,
        bio || "",
        Array.isArray(skills)
          ? skills
          : [],
        Array.isArray(learning)
          ? learning
          : [],
      ]
    );

    const newUser = result.rows[0];

    // Notify admin dashboard
    const io = req.app.get("io");

    if (io) {
      io.to("admin_room").emit(
        "admin-user-created",
        newUser
      );
    }

    res.status(201).json({
      message:
        "Profile created successfully",
      user: newUser,
    });

  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({
      message: "Failed to create profile",
      error: error.message,
    });
  }
});


// ==========================================
// UPDATE USER PROFILE
// ==========================================

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      bio,
      location,
      skills,
      learning,
    } = req.body;

    console.log(
      "Updating user:",
      id
    );

    console.log(
      "Update data:",
      req.body
    );

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET
         name = $1,
         bio = $2,
         location = $3,
         skills = $4,
         learning = $5
       WHERE id = $6
       RETURNING
         id,
         name,
         email,
         bio,
         skills,
         learning,
         location,
         city,
         country,
         latitude,
         longitude,
         profile_picture,
         created_at`,
      [
        name.trim(),
        bio || "",
        location || "",
        Array.isArray(skills)
          ? skills
          : [],
        Array.isArray(learning)
          ? learning
          : [],
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updatedUser =
      result.rows[0];

    console.log(
      "User updated successfully:",
      updatedUser
    );

    // Notify admin dashboard
    const io = req.app.get("io");

    if (io) {
      io.to("admin_room").emit(
        "admin-user-updated",
        updatedUser
      );
    }

    return res.status(200).json({
      message:
        "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error(
      "UPDATE USER ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update profile",
      error: error.message,
    });
  }
});

// ==========================================
// UPDATE USER CURRENT LOCATION
// ==========================================

router.put("/:id/location", async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    console.log("Updating location for user:", id);
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);

    // Validate coordinates
    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === null ||
      longitude === null
    ) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    // Check if numbers are valid
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return res.status(400).json({
        message: "Invalid latitude or longitude",
      });
    }

    // Check geographic ranges
    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        message: "Invalid latitude",
      });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        message: "Invalid longitude",
      });
    }

    // Save location
    const result = await pool.query(
      `UPDATE users
       SET
         latitude = $1,
         longitude = $2
       WHERE id = $3
       RETURNING
         id,
         name,
         email,
         bio,
         skills,
         learning,
         location,
         city,
         country,
         latitude,
         longitude,
         profile_picture,
         created_at`,
      [
        lat,
        lng,
        id,
      ]
    );

    // User doesn't exist
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updatedUser = result.rows[0];

    console.log(
      "Location updated successfully:",
      updatedUser.latitude,
      updatedUser.longitude
    );

    // Notify admin dashboard
    const io = req.app.get("io");

    if (io) {
      io.to("admin_room").emit(
        "admin-user-location-updated",
        updatedUser
      );
    }

    return res.status(200).json({
      message: "Location updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error(
      "UPDATE LOCATION ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to update location",
      error: error.message,
    });
  }
});
// ==========================================
// UPLOAD PROFILE PICTURE
// ==========================================

router.post(
  "/:id/profile-picture",
  upload.single("profile_picture"),

  async (req, res) => {
    try {
      const { id } = req.params;

      console.log(
        "Profile picture upload for user:",
        id
      );

      if (!req.file) {
        return res.status(400).json({
          message:
            "Please select an image",
        });
      }

      const profilePictureUrl =
        `/uploads/${req.file.filename}`;

      const result = await pool.query(
        `UPDATE users
         SET profile_picture = $1
         WHERE id = $2
         RETURNING
           id,
           name,
           email,
           bio,
           skills,
           learning,
           location,
           city,
           country,
           latitude,
           longitude,
           profile_picture,
           created_at`,
        [
          profilePictureUrl,
          id,
        ]
      );

      if (result.rows.length === 0) {

        // Delete uploaded file
        try {
          fs.unlinkSync(
            req.file.path
          );
        } catch (fileError) {
          console.error(
            "Could not remove file:",
            fileError
          );
        }

        return res.status(404).json({
          message: "User not found",
        });
      }

      const updatedUser =
        result.rows[0];

      console.log(
        "Profile picture saved:",
        profilePictureUrl
      );

      // Notify admin dashboard
      const io = req.app.get("io");

      if (io) {
        io.to("admin_room").emit(
          "admin-user-updated",
          updatedUser
        );
      }

      return res.status(200).json({
        message:
          "Profile picture uploaded successfully",
        user: updatedUser,
      });

    } catch (error) {
      console.error(
        "PROFILE PICTURE ERROR:",
        error
      );

      // Remove uploaded file
      if (req.file) {
        try {
          fs.unlinkSync(
            req.file.path
          );
        } catch (fileError) {
          console.error(
            "Could not remove uploaded file:",
            fileError
          );
        }
      }

      return res.status(500).json({
        message:
          "Failed to upload profile picture",
        error: error.message,
      });
    }
  }
);


// ==========================================
// UPLOAD INTEREST MEDIA
// ==========================================

router.post(
  "/:id/interest-media",
  interestUpload.single("interest_media"),

  async (req, res) => {
    try {
      const { id } = req.params;
      const { interest } = req.body;

      console.log(
        "Interest media upload:",
        id,
        interest
      );

      if (!interest) {
        return res.status(400).json({
          message: "Interest is required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please select a file",
        });
      }

      // ------------------------------------------
      // CHECK USER
      // ------------------------------------------

      const userResult = await pool.query(
        `SELECT
          id,
          skills,
          interest_media
         FROM users
         WHERE id = $1`,
        [id]
      );

      if (userResult.rows.length === 0) {
        fs.unlinkSync(req.file.path);

        return res.status(404).json({
          message: "User not found",
        });
      }

      const user = userResult.rows[0];

      
      // ------------------------------------------
      // CHECK SELECTED INTEREST
      // ------------------------------------------

      if (!user.skills?.includes(interest)) {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message:
            "This interest is not selected on the user's profile.",
        });
      }

      // ------------------------------------------
      // RESTRICT FILE TYPE BY INTEREST
      // ------------------------------------------

      const fileType = req.file.mimetype;

      const rules = {
        "🎨 Art": ["image/"],

        "📸 Photography": ["image/"],

        "💻 Coding": [
          "image/",
          "text/",
          "application/pdf",
          "application/zip",
        ],

        "🎵 Music": ["audio/"],

        "📚 Books": [
          "application/pdf",
        ],

        "🎬 Movies": ["video/"],

        "✈️ Travel": [
          "image/",
          "video/",
        ],

        "🎮 Gaming": [
          "image/",
          "video/",
        ],
      };

      const allowedForInterest =
        rules[interest];

      if (!allowedForInterest) {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message:
            "No upload rule exists for this interest.",
        });
      }

      const isAllowed =
        allowedForInterest.some((type) =>
          type.endsWith("/")
            ? fileType.startsWith(type)
            : fileType === type
        );

      if (!isAllowed) {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message:
            `Invalid file type for ${interest}.`,
        });
      }

      // ------------------------------------------
      // SAVE MEDIA URL
      // ------------------------------------------

      const mediaUrl =
        `/uploads/${req.file.filename}`;

      const currentMedia =
        user.interest_media || {};

      const updatedMedia = {
        ...currentMedia,
        [interest]: {
          url: mediaUrl,
          type: fileType,
          originalName:
            req.file.originalname,
        },
      };

      const result = await pool.query(
        `UPDATE users
         SET interest_media = $1
         WHERE id = $2
         RETURNING
           id,
           name,
           skills,
           interest_media`,
        [
          updatedMedia,
          id,
        ]
      );

      console.log(
        "Interest media saved:",
        interest,
        mediaUrl
      );

      return res.status(200).json({
        message:
          "Interest media uploaded successfully",
        user: result.rows[0],
      });

    } catch (error) {
      console.error(
        "INTEREST MEDIA ERROR:",
        error
      );

      if (req.file) {
        try {
          fs.unlinkSync(
            req.file.path
          );
        } catch (fileError) {
          console.error(
            "Could not remove uploaded file:",
            fileError
          );
        }
      }

      return res.status(500).json({
        message:
          "Failed to upload interest media",
        error: error.message,
      });
    }
  }
);
// =====================================================
// SAVE PRIVACY FOR ONE INTEREST
// =====================================================
// =====================================================
// SAVE PRIVACY FOR ONE INTEREST
// =====================================================

// =====================================================
// SAVE PRIVACY FOR ONE INTEREST
// =====================================================

router.put(
  "/:id/interest-gallery-privacy/interest",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { interest, visibility } = req.body;

      console.log(
        "Updating interest privacy:",
        id,
        interest,
        visibility
      );

      // -----------------------------------------------
      // VALIDATE INTEREST
      // -----------------------------------------------

      if (!interest || !interest.trim()) {
        return res.status(400).json({
          message: "Interest is required.",
        });
      }

      // -----------------------------------------------
      // VALID PRIVACY OPTIONS
      // -----------------------------------------------

      const validVisibility = [
        "everyone",
        "connections",
        "selected",
        "only_me",
      ];

      if (!validVisibility.includes(visibility)) {
        return res.status(400).json({
          message: "Invalid privacy option.",
        });
      }

      // -----------------------------------------------
      // CHECK USER
      // -----------------------------------------------

      const userResult = await pool.query(
        `
        SELECT
          id,
          skills,
          interest_gallery_privacy
        FROM users
        WHERE id = $1
        `,
        [id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      const user = userResult.rows[0];

      // -----------------------------------------------
      // MAKE SURE THIS IS THE USER'S INTEREST
      // -----------------------------------------------

      if (!user.skills?.includes(interest)) {
        return res.status(400).json({
          message:
            "This interest is not selected on the user's profile.",
        });
      }

      // -----------------------------------------------
      // GET CURRENT PRIVACY SETTINGS
      // -----------------------------------------------

      const currentPrivacy =
        user.interest_gallery_privacy || {};

      // -----------------------------------------------
      // UPDATE ONLY THIS INTEREST
      // -----------------------------------------------

      const updatedPrivacy = {
        ...currentPrivacy,
        [interest]: visibility,
      };

      // -----------------------------------------------
      // SAVE
      // -----------------------------------------------

      const result = await pool.query(
        `
        UPDATE users
        SET interest_gallery_privacy = $1
        WHERE id = $2
        RETURNING
          id,
          interest_gallery_privacy
        `,
        [
          updatedPrivacy,
          id,
        ]
      );

      console.log(
        "Interest privacy updated:",
        result.rows[0]
      );

      // -----------------------------------------------
      // RESPONSE
      // -----------------------------------------------

      return res.status(200).json({
        message:
          "Interest privacy updated successfully.",
        user: result.rows[0],
      });

    } catch (error) {
      console.error(
        "INTEREST PRIVACY UPDATE ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update interest privacy.",
        error: error.message,
      });
    }
  }
);
// ==========================================
// DELETE USER ACCOUNT
// ==========================================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log(
      "Deleting user:",
      id
    );

    const result = await pool.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING
         id,
         name,
         email,
         profile_picture`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const deletedUser =
      result.rows[0];

    console.log(
      "User deleted successfully:",
      deletedUser
    );

    // Notify admin dashboard
    const io = req.app.get("io");

    if (io) {
      io.to("admin_room").emit(
        "admin-user-deleted",
        deletedUser
      );
    }

    return res.status(200).json({
      message:
        "Account deleted successfully",
      user: deletedUser,
    });

  } catch (error) {
    console.error(
      "DELETE USER ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to delete account",
      error: error.message,
    });
  }
});


router.put("/:id/interest-gallery-privacy", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      visibility,
      allowedConnections = [],
    } = req.body;

    const validVisibility = [
      "everyone",
      "connections",
      "selected",
      "only_me",
    ];

    if (!validVisibility.includes(visibility)) {
      return res.status(400).json({
        message: "Invalid privacy option",
      });
    }

    if (!Array.isArray(allowedConnections)) {
      return res.status(400).json({
        message: "allowedConnections must be an array",
      });
    }

    // Make sure selected users are actually accepted connections
    if (
      visibility === "selected" &&
      allowedConnections.length > 0
    ) {
      const connectionCheck = await pool.query(
        `
        SELECT
          CASE
            WHEN sender_id = $1 THEN receiver_id
            ELSE sender_id
          END AS user_id
        FROM connections
        WHERE
          (sender_id = $1 OR receiver_id = $1)
          AND status = 'accepted'
          AND (
            CASE
              WHEN sender_id = $1 THEN receiver_id
              ELSE sender_id
            END
          ) = ANY($2::int[])
        `,
        [id, allowedConnections]
      );

      if (
        connectionCheck.rows.length !==
        allowedConnections.length
      ) {
        return res.status(400).json({
          message:
            "You can only select your accepted connections",
        });
      }
    }

    const result = await pool.query(
      `
      UPDATE users
      SET
        interest_gallery_visibility = $1,
        interest_gallery_allowed_connections = $2
      WHERE id = $3
      RETURNING
        id,
        interest_gallery_visibility,
        interest_gallery_allowed_connections
      `,
      [
        visibility,
        allowedConnections,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Interest gallery privacy updated",
      privacy: result.rows[0],
    });

  } catch (error) {
    console.error(
      "INTEREST GALLERY PRIVACY ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to update gallery privacy",
    });
  }
});

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;