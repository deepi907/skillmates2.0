import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
const API_URL = import.meta.env.VITE_API_URL;
function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
   
  // ==========================================
  // FETCH USERS
  // ==========================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/users`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(
        "Admin users error:",
        err
      );

      setError(
        "Could not load users from the SkillMates server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // DELETE USER
  // ==========================================

  const deleteUser = async (
    userId,
    userName
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${userName || "this user"}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete user"
        );
      }

      // Remove deleted user from screen
      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) => user.id !== userId
        )
      );
    } catch (err) {
      console.error(
        "Delete user error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete user."
      );
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // ==========================================
  // MAIN
  // ==========================================

  return (
    <Box>
      {/* ================= HEADER ================= */}

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
        >
          Users
        </Typography>

        <Typography color="text.secondary">
          All registered SkillMates users
        </Typography>
      </Box>

      {/* ================= ERROR ================= */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* ================= USERS TABLE ================= */}

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* TABLE HEADER */}

        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom:
              "1px solid #e5e7eb",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
          >
            Registered Users
          </Typography>

          <Chip
            label={`${users.length} users`}
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* TABLE */}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>User</strong>
                </TableCell>

                <TableCell>
                  <strong>Email</strong>
                </TableCell>

                <TableCell>
                  <strong>Skills</strong>
                </TableCell>

                <TableCell>
                  <strong>Learning</strong>
                </TableCell>

                <TableCell>
                  <strong>Joined</strong>
                </TableCell>

                <TableCell align="center">
                  <strong>Action</strong>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 5 }}
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const skills = Array.isArray(
                    user.skills
                  )
                    ? user.skills
                    : [];

                  const learning =
                    Array.isArray(
                      user.learning
                    )
                      ? user.learning
                      : [];

                  const initial =
                    user.name
                      ?.charAt(0)
                      ?.toUpperCase() || "U";

                  return (
                    <TableRow
                      key={user.id}
                      hover
                    >
                      {/* USER */}

                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: 1.5,
                          }}
                        >
                          <Avatar>
                            {initial}
                          </Avatar>

                          <Box>
                            <Typography
                              fontWeight={600}
                            >
                              {user.name ||
                                "Unknown User"}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              ID: {user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* EMAIL */}

                      <TableCell>
                        {user.email || "—"}
                      </TableCell>

                      {/* SKILLS */}

                      <TableCell>
                        {skills.length > 0
                          ? skills.join(", ")
                          : "—"}
                      </TableCell>

                      {/* LEARNING */}

                      <TableCell>
                        {learning.length > 0
                          ? learning.join(", ")
                          : "—"}
                      </TableCell>

                      {/* JOINED */}

                      <TableCell>
                        {user.created_at
                          ? new Date(
                              user.created_at
                            ).toLocaleDateString()
                          : "—"}
                      </TableCell>

                      {/* DELETE */}

                      <TableCell align="center">
                        <button
                          type="button"
                          onClick={() =>
                            deleteUser(
                              user.id,
                              user.name
                            )
                          }
                          style={{
                            border: "none",
                            background:
                              "#dc2626",
                            color: "#ffffff",
                            padding:
                              "7px 12px",
                            borderRadius:
                              "6px",
                            cursor: "pointer",
                            fontSize:
                              "13px",
                            fontWeight:
                              "500",
                          }}
                        >
                          Delete
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default Users;