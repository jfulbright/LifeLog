import React from "react";
import { NavLink } from "react-router-dom";
import categoryMeta from "helpers/categoryMeta";

const navItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/timeline", label: "Timeline", icon: "📅" },
  { path: "/snaps", label: "Snapshots", icon: "📸" },
];

const categoryItems = [
  { path: "/concerts", key: "concerts", label: "Concerts" },
  { path: "/travel", key: "travel", label: "Travel" },
  { path: "/cars", key: "cars", label: "Cars" },
  { path: "/homes", key: "homes", label: "Homes" },
];

/**
 * Desktop sidebar and mobile Offcanvas content share the same nav list.
 * This component renders the nav items; the parent decides whether
 * to put them in a sidebar or Offcanvas.
 */
function SidebarNav({ counts = {}, onItemClick }) {
  return (
    <nav style={{ paddingBottom: "1rem" }}>
      <div className="sidebar-section-label">Navigate</div>

      {navItems.map((item) => (
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
    </nav>
  );
}

export { categoryItems };
export default SidebarNav;
