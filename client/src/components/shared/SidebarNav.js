import React from "react";
import { NavLink } from "react-router-dom";
import categoryMeta from "../../helpers/categoryMeta";

const navigateItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/timeline", label: "Timeline", icon: "📅" },
  { path: "/snaps", label: "My Memories", icon: "📸" },
];

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
];

function SidebarNav({ counts = {}, notificationCount = 0, onItemClick }) {
  return (
    <nav style={{ paddingBottom: "1rem", display: "flex", flexDirection: "column", height: "calc(100% - 60px)" }}>
      <div style={{ flex: 1 }}>
        {/* Navigate section */}
        <div className="sidebar-section-label">Navigate</div>
        {navigateItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? "active" : ""}`
            }
            onClick={onItemClick}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

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

      {/* Settings pinned at bottom */}
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
      </div>
    </nav>
  );
}

export { categoryItems };
export default SidebarNav;
