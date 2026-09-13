import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { io } from "socket.io-client";
const API_URL = import.meta.env.VITE_API_URL;
function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // LOAD MESSAGES
  // ==========================================

  const fetchMessages = async () => {
    try {
      const response = await fetch(
      `${API_URL}/api/admin/messages`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();

      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Admin messages error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD + REAL-TIME SOCKET
  // ==========================================

  useEffect(() => {
    fetchMessages();

    const socket = io(API_URL, {
      transports: ["polling", "websocket"],
    });

    socket.on("connect", () => {
      console.log(
        "👑 Admin Messages connected:",
        socket.id
      );

      socket.emit("join-admin");
    });

    socket.on("admin-new-message", (newMessage) => {
      console.log(
        "💬 New admin message:",
        newMessage
      );

      setMessages((currentMessages) => {
        const exists = currentMessages.some(
          (item) => item.id === newMessage.id
        );

        if (exists) {
          return currentMessages;
        }

        return [newMessage, ...currentMessages];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography color="text.secondary">
          Loading messages...
        </Typography>
      </Box>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <Box>
      {/* HEADER */}

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ mb: 0.5 }}
        >
          Messages
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Monitor conversations between SkillMates
        </Typography>
      </Box>

      {/* SUMMARY */}

      <Box sx={{ mb: 2 }}>
        <Chip
          label={`${messages.length} messages`}
          variant="outlined"
        />
      </Box>

      {/* TABLE */}

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Sender</strong>
                </TableCell>

                <TableCell>
                  <strong>Receiver</strong>
                </TableCell>

                <TableCell>
                  <strong>Message</strong>
                </TableCell>

                <TableCell>
                  <strong>Status</strong>
                </TableCell>

                <TableCell>
                  <strong>Time</strong>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                  >
                    No messages yet.
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                  >
                    <TableCell>
                      <Typography
                        fontWeight={600}
                      >
                        {item.sender_name ||
                          `User ${item.sender_id}`}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        fontWeight={600}
                      >
                        {item.receiver_name ||
                          `User ${item.receiver_id}`}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        maxWidth: 350,
                        wordBreak: "break-word",
                      }}
                    >
                      {item.message}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          item.is_read
                            ? "Read"
                            : "Unread"
                        }
                        color={
                          item.is_read
                            ? "success"
                            : "default"
                        }
                      />
                    </TableCell>

                    <TableCell>
                      {item.created_at
                        ? new Date(
                            item.created_at
                          ).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default Messages;