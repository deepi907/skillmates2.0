import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  TextField,
  Typography,
} from "@mui/material";

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    // Temporary admin login.
    // We will connect this to PostgreSQL later.
    onLogin({
      id: "admin",
      name: "SkillMates Admin",
      email,
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f7fa",
        padding: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 430,
          borderRadius: 3,
          boxShadow: 4,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            textAlign="center"
            fontWeight={700}
          >
            Skill
            <span style={{ color: "#1677ff" }}>
              Mates
            </span>
          </Typography>

          <Typography
            textAlign="center"
            color="text.secondary"
            sx={{ mt: 1, mb: 3 }}
          >
            {showSignup
              ? "Create Admin Account"
              : "Admin Dashboard"}
          </Typography>

          <form onSubmit={handleSubmit}>
            {showSignup && (
              <TextField
                fullWidth
                label="Admin Name"
                margin="normal"
              />
            )}

            <TextField
              fullWidth
              required
              label="Email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              margin="normal"
            />

            <TextField
              fullWidth
              required
              label="Password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              margin="normal"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{
                mt: 2,
                mb: 2,
                py: 1.3,
              }}
            >
              {showSignup
                ? "Sign Up"
                : "Login"}
            </Button>
          </form>

          <Divider sx={{ my: 2 }} />

          <Typography
            variant="body2"
            textAlign="center"
            color="text.secondary"
          >
            {showSignup
              ? "Already have an account?"
              : "Don't have an admin account?"}
          </Typography>

          <Button
            fullWidth
            onClick={() =>
              setShowSignup((prev) => !prev)
            }
            sx={{ mt: 1 }}
          >
            {showSignup
              ? "Login"
              : "Sign Up"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AdminLogin;