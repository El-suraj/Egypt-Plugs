import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { C } from "./ui";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
  { to: "/shipments/new", icon: "ti-plus", label: "New Shipment" },
  { to: "/shipments", icon: "ti-package", label: "Shipments" },
  { to: "/sacks", icon: "ti-briefcase", label: "Sacks / Manifests" },
  { to: "/search", icon: "ti-search", label: "Search Parcel" },
  { to: "/arrivals", icon: "ti-plane-arrival", label: "Arrivals & Delivery" },
  { to: "/payments", icon: "ti-credit-card", label: "Payments" },
  { to: "/customers", icon: "ti-users", label: "Customers" },
  { to: "/reports", icon: "ti-chart-bar", label: "Reports" },
  { to: "/settings", icon: "ti-settings", label: "Settings" },
];

const ROLE_LABELS = {
  admin: "Administrator",
  cairo_staff: "Cairo Staff",
  kano_staff: "Kano Staff",
  abuja_staff: "Abuja Staff",
};

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const initials =
    user.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div
      style={{
        width: 200,
        minHeight: "100vh",
        background: C.navy,
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              background: C.blue,
              borderRadius: 2,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i
              className="ti ti-plane-tilt"
              style={{ color: "#fff", fontSize: 16 }}
            />
          </div>
          <div>
            <div
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                lineHeight: 1.2,
              }}
            >
              EGYPT PLUGS
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9 }}>
              AIR SHIPPING SERVICES
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 16px",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
              background: isActive ? "rgba(37,99,235,0.5)" : "transparent",
              borderLeft: `3px solid ${isActive ? "#3b82f6" : "transparent"}`,
              transition: "all 0.15s",
            })}
          >
            <i
              className={`ti ${item.icon}`}
              style={{ fontSize: 16, minWidth: 16 }}
            />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: C.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.name}
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
              {ROLE_LABELS[user.role] || user.role}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
            {user.office} Office · Online
          </span>
        </div>
      </div>
    </div>
  );
}

export function TopBar({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
      }}
    >
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: C.muted, margin: "2px 0 0" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Office badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: "6px 12px",
            fontSize: 13,
          }}
        >
          <i
            className="ti ti-map-pin"
            style={{ color: C.blue, fontSize: 14 }}
          />
          <span style={{ fontWeight: 500 }}>{user?.office} Office</span>
        </div>

        {/* Custom action area */}
        {children}

        {/* User menu */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            position: "relative",
          }}
          onClick={logout}
          title="Logout"
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: C.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: C.muted }}>
              {ROLE_LABELS[user?.role]}
            </div>
          </div>
          <i
            className="ti ti-logout"
            style={{ fontSize: 16, color: C.muted, marginLeft: 4 }}
            title="Logout"
          />
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar />
      <main
        style={{ flex: 1, marginLeft: 200, padding: "24px 28px", minWidth: 0 }}
      >
        {children}
      </main>
    </div>
  );
}
