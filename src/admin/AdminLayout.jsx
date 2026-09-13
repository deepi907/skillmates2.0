import { useState } from "react";

import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

const drawerWidth = 240;

const menuItems = [
  {
    label: "Dashboard",
    icon: "▣",
  },
  {
    label: "Users",
    icon: "👥",
  },
  {
    label: "Members",
    icon: "👤",
  },
  {
    label: "Matches",
    icon: "♥",
  },
  {
    label: "Messages",
    icon: "💬",
  },
];

function AdminLayout({
  page,
  setPage,
  admin,
  onLogout,
  children,
}) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const drawerContent = (
    <>
      <Toolbar>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ px: 1 }}
        >
          Skill
          <Box
            component="span"
            sx={{ color: "#1677ff" }}
          >
            Mates
          </Box>
        </Typography>
      </Toolbar>

      <Divider />

      <List sx={{ px: 1.5, py: 2 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.label}
            selected={page === item.label}
            onClick={() => {
              setPage(item.label);
              setMobileOpen(false);
            }}
            sx={{
              borderRadius: 2,
              mb: 0.7,

              "&.Mui-selected": {
                backgroundColor: "#eaf2ff",
                color: "#1677ff",
              },

              "&.Mui-selected:hover": {
                backgroundColor: "#eaf2ff",
              },
            }}
          >
            <Box
              sx={{
                width: 40,
                fontSize: 18,
              }}
            >
              {item.icon}
            </Box>

            <ListItemText
              primary={item.label}
            />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
      }}
    >
      {/* DESKTOP SIDEBAR */}

      <Drawer
        variant="permanent"
        sx={{
          display: {
            xs: "none",
            md: "block",
          },

          width: drawerWidth,
          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight:
              "1px solid #e5e7eb",
            backgroundColor: "#fff",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* MOBILE SIDEBAR */}

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
        sx={{
          display: {
            xs: "block",
            md: "none",
          },

          "& .MuiDrawer-paper": {
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* MAIN */}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        {/* HEADER */}

        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: "#ffffff",
            color: "#1f2937",
            borderBottom:
              "1px solid #e5e7eb",
          }}
        >
          <Toolbar
            sx={{
              justifyContent:
                "space-between",
            }}
          >
            <IconButton
              onClick={() =>
                setMobileOpen(true)
              }
              sx={{
                display: {
                  xs: "inline-flex",
                  md: "none",
                },
              }}
            >
              ☰
            </IconButton>

            <Typography
              variant="h6"
              fontWeight={600}
            >
              {page}
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                }}
              >
                {(admin?.name || "A")
                  .charAt(0)
                  .toUpperCase()}
              </Avatar>

              <Box
                sx={{
                  display: {
                    xs: "none",
                    sm: "block",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                >
                  {admin?.name ||
                    "Admin"}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Administrator
                </Typography>
              </Box>

              <button
                type="button"
                onClick={onLogout}
                style={{
                  border: "none",
                  background:
                    "transparent",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
                title="Logout"
              >
                ↪
              </button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* CONTENT */}

        <Box
          sx={{
            p: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default AdminLayout;