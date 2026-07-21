import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Shipments from "./pages/Shipments.jsx";
import NewShipment from "./pages/NewShipment.jsx";
import ParcelDetail from "./pages/ParcelDetail.jsx";
import Sacks from "./pages/Sacks.jsx";
import SackDetail from "./pages/SackDetail.jsx";
import Customers from "./pages/Customers.jsx";
import Payments from "./pages/Payments.jsx";
import Arrivals from "./pages/Arrivals.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import Track from "./pages/Track.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "4px solid #e5e7eb",
              borderTopColor: "#2563eb",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#6b7280", fontSize: 14 }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/track/:tracking_id" element={<Track />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipments"
            element={
              <ProtectedRoute>
                <Shipments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipments/new"
            element={
              <ProtectedRoute>
                <NewShipment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipments/:tracking_id"
            element={
              <ProtectedRoute>
                <ParcelDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sacks"
            element={
              <ProtectedRoute>
                <Sacks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sacks/new"
            element={
              <ProtectedRoute>
                <Sacks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sacks/:id"
            element={
              <ProtectedRoute>
                <SackDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <ParcelDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/arrivals"
            element={
              <ProtectedRoute>
                <Arrivals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
