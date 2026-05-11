import React from "react";
import { NavLink } from "react-router-dom";
import categoryMeta from "../../helpers/categoryMeta";

const socialItems = [
  { path: "/people", label: "My People", icon: "👥" },
  { path: "/shared", label: "Shared Experiences", icon: "🤝", badge: "notifications" },
  { path: "/recommendations", label: "Recommendations", icon: "⭐" },
];

const categoryItems = [
  { path: "/events", key: "events", label: "Events" },
  { path: "/travel", key: "travel", label: "Travel" },
  { path: "/activities", key: "activities", label: "Activities" },
  { path: "/cellar", key: "cellar", label: "Cellar" },
  { path: "/cars", key: "cars", label: "Cars" },
  { path: "/homes", key: "homes", label: "Homes" },
  { path: "/kids", key: "kids", label: "Kids" },
];

function SidebarNav({ counts = {}, notificationCount = 0, user, onSignOut, onItemClick }) {
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "My Profile";

  return (
    <nav style={{ paddingBottom: "1rem", display: "flex", flexDirection: "column", height: "calc(100% - 60px)" }}>
      <div style={{ flex: 1 }}>
        {/* Profile link (user's name) */}
        <div className="sidebar-section-label">Navigate</div>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
          onClick={onItemClick}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: "var(--color-primary)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.6rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {displayName[0]?.toUpperCase()}
          </span>
          <span style={{ marginLeft: "0.4rem" }}>{displayName}</span>
        </NavLink>
        <NavLink
          to="/timeline"
          className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
          onClick={onItemClick}
        >
          <span className="sidebar-nav-icon">📅</span>
          My Timeline
        </NavLink>
        <NavLink
          to="/snaps"
          className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
          onClick={onItemClick}
        >
          <span className="sidebar-nav-icon">📸</span>
          My Memories
        </NavLink>

        {/* Social section */}
        <div className="sidebar-section-label" style={{ marginTop: "0.5rem" }}>Social</div>
        {socialItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? "active" : ""}`
            }
            onClick={onItemClick}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {item.label}
            {item.badge === "notifications" && notificationCount > 0 && (
              <span className="sidebar-nav-count sidebar-nav-count--alert">
                {notificationCount}
              </span>
            )}
          </NavLink>
        ))}

        {/* Snap Categories section */}
        <div className="sidebar-section-label" style={{ marginTop: "0.5rem" }}>Snap Categories</div>
        {categoryItems.map((item) => {
          const meta = categoryMeta[item.key] || {};
          const count = counts[item.key] || 0;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? "active" : ""}`
              }
              onClick={onItemClick}
            >
              <span className="sidebar-nav-icon">{meta.icon}</span>
              {item.label}
              {count > 0 && (
                <span className="sidebar-nav-count">{count}</span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Settings + Sign Out pinned at bottom */}
      <div style={{ borderTop: "1px solid var(--color-sidebar-border)", paddingTop: "0.5rem" }}>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-nav-item ${isActive ? "active" : ""}`
          }
          onClick={onItemClick}
        >
          <span className="sidebar-nav-icon">⚙️</span>
          Settings
        </NavLink>
        {onSignOut && (
          <button
            type="button"
            className="sidebar-nav-item"
            onClick={onSignOut}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
          >
            <span className="sidebar-nav-icon">🚪</span>
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}

export { categoryItems };
export default SidebarNav;
