import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import App from "./App.jsx";
import AdminApp from "./admin/AdminApp.jsx";

import { ConvexReactClient, ConvexProvider } from "convex/react";

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL
);

const isAdminRoute =
  window.location.pathname.startsWith("/admin");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isAdminRoute ? (
      <AdminApp />
    ) : (
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    )}
  </StrictMode>
);