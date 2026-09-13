import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import AdminLogin from "./AdminLogin";
import AdminLayout from "./AdminLayout";

import Dashboard from "./Dashboard";
import Users from "./Users";
import Members from "./Members";
import Matches from "./Matches";
import Messages from "./Messages";
const API_URL = import.meta.env.VITE_API_URL;
function AdminApp() {
  const [admin, setAdmin] = useState(null);

  const [page, setPage] = useState("Dashboard");

  const [stats, setStats] = useState({
    users: 0,
    members: 0,
    matches: 0,
    messages: 0,
  });
  

  // ==========================================
  // FETCH ADMIN STATS + REAL-TIME UPDATES
  // ==========================================

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/stats`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch admin statistics"
          );
        }

        const data = await response.json();

        setStats({
          users: data.users ?? 0,
          members: data.members ?? 0,
          matches: data.matches ?? 0,
          messages: data.messages ?? 0,
        });
      } catch (error) {
        console.error(
          "Admin stats error:",
          error
        );
      }
    };

    fetchStats();

    // ========================================
    // ADMIN SOCKET
    // ========================================

    const socket = io(
      API_URL,
      {
        transports: [
          "polling",
          "websocket",
        ],
      }
    );

    socket.on("connect", () => {
      console.log(
        "👑 Admin dashboard connected:",
        socket.id
      );

      socket.emit("join-admin");
    });

    // ----------------------------------------
    // NEW USER
    // ----------------------------------------

    socket.on(
      "admin-user-created",
      (newUser) => {
        console.log(
          "👤 New user:",
          newUser
        );

        fetchStats();
      }
    );

    // ----------------------------------------
    // MATCH UPDATED
    // ----------------------------------------

    socket.on(
      "admin-match-updated",
      (connection) => {
        console.log(
          "❤️ Connection updated:",
          connection
        );

        fetchStats();
      }
    );

    // ----------------------------------------
    // NEW MESSAGE
    // ----------------------------------------

    socket.on(
      "admin-new-message",
      (message) => {
        console.log(
          "💬 New message:",
          message
        );

        fetchStats();
      }
    );

    socket.on("disconnect", () => {
      console.log(
        "👑 Admin dashboard disconnected"
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ==========================================
  // ADMIN LOGIN
  // ==========================================

  if (!admin) {
    return (
      <AdminLogin
        onLogin={(adminUser) => {
          setAdmin(adminUser);
        }}
      />
    );
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    setAdmin(null);
    setPage("Dashboard");
  };

  // ==========================================
  // PAGE CONTENT
  // ==========================================

  const renderPage = () => {
    switch (page) {
      case "Users":
        return <Users />;

      case "Members":
        return <Members />;

      case "Matches":
        return <Matches />;

      case "Messages":
        return <Messages />;

      case "Dashboard":
      default:
        return <Dashboard stats={stats} />;
    }
  };

  // ==========================================
  // ADMIN LAYOUT
  // ==========================================

  return (
    <AdminLayout
      page={page}
      setPage={setPage}
      admin={admin}
      onLogout={handleLogout}
    >
      {renderPage()}
    </AdminLayout>
  );
}

export default AdminApp;