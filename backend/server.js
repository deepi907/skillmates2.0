const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();
const pool = require("./db");
console.log(
  "GEMINI_API_KEY loaded:",
  process.env.GEMINI_API_KEY ? "YES" : "NO"
);

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());
app.use(
  "/uploads",
  express.static("uploads")
);

// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "SkillMates API is running 🚀",
  });
});


// ==========================================
// ROUTES
// ==========================================

const userRoutes = require("./routes/userRoutes");
const loginRoutes = require("./routes/loginRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const aiRoutes = require("./routes/aiRoutes");
const adminRoutes = require("./routes/adminRoutes");

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/users", userRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/ai", aiRoutes);

app.use("/api/admin", adminRoutes);
// ==========================================
// HTTP SERVER
// ==========================================

const server = http.createServer(app);


// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
// ==========================================
// SOCKET CONNECTION
// ==========================================

io.on("connection", (socket) => {
  socket.on("join-admin", () => {
  socket.join("admin_room");

  console.log(
    "👑 Admin joined admin room:",
    socket.id
  );
});

  console.log("🟢 User connected:", socket.id);


  // USER JOINS
  socket.on("join", (userId) => {

    socket.join(`user_${userId}`);

    console.log(
      `👤 User ${userId} joined room`
    );

  });


  // ==========================================
  // SEND MESSAGE
  // ==========================================

socket.on("send-message", async (data) => {
  try {
    console.log("💬 Message:", data);

    const {
      senderId,
      receiverId,
      message,
    } = data;

    if (
      !senderId ||
      !receiverId ||
      !message ||
      !message.trim()
    ) {
      return;
    }

    const result = await pool.query(
      `INSERT INTO messages
       (sender_id, receiver_id, message, is_read)
       VALUES ($1, $2, $3, $4)
       RETURNING
         id,
         sender_id,
         receiver_id,
         message,
         is_read,
         created_at`,
      [
        senderId,
        receiverId,
        message.trim(),
        false,
      ]
    );

    const savedMessage = result.rows[0];

    // Send message to receiver
    io.to(`user_${receiverId}`).emit(
      "receive-message",
      savedMessage
    );

    // Send to sender too, if needed
    io.to(`user_${senderId}`).emit(
      "message-sent",
      savedMessage
    );

    // Send to admin dashboard
    io.to("admin_room").emit(
      "admin-new-message",
      savedMessage
    );

  } catch (error) {
    console.error(
      "❌ Message save error:",
      error
    );
  }
});


  // ==========================================
  // WEBRTC SIGNALING
  // ==========================================

  socket.on("call-user", (data) => {

    console.log(
      "📞 Call request:",
      data
    );

    io.to(`user_${data.receiverId}`).emit(
      "incoming-call",
      data
    );

  });


  socket.on("accept-call", (data) => {

    io.to(`user_${data.receiverId}`).emit(
      "call-accepted",
      data
    );

  });


  socket.on("reject-call", (data) => {

    io.to(`user_${data.receiverId}`).emit(
      "call-rejected",
      data
    );

  });


  // ==========================================
  // WEBRTC OFFER
  // ==========================================

  socket.on("webrtc-offer", (data) => {

    io.to(`user_${data.receiverId}`).emit(
      "webrtc-offer",
      data
    );

  });


  // ==========================================
  // WEBRTC ANSWER
  // ==========================================

  socket.on("webrtc-answer", (data) => {

    io.to(`user_${data.receiverId}`).emit(
      "webrtc-answer",
      data
    );

  });


  // ==========================================
  // ICE CANDIDATE
  // ==========================================

  socket.on("webrtc-ice-candidate", (data) => {

    io.to(`user_${data.receiverId}`).emit(
      "webrtc-ice-candidate",
      data
    );

  });


  // ==========================================
  // END CALL
  // ==========================================

  socket.on("end-call", (data) => {

    io.to(`user_${data.receiverId}`).emit(
      "call-ended"
    );

  });


  // ==========================================
  // DISCONNECT
  // ==========================================

  socket.on("disconnect", () => {

    console.log(
      "🔴 User disconnected:",
      socket.id
    );

  });

});


// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(
    `SkillMates server running on port ${PORT}`
  );

});