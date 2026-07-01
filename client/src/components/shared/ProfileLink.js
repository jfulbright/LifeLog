import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Reusable entry point to a user's profile (Epic D / D1). Renders a clickable
 * name (optionally with an avatar) that routes to /u/:userId. Use anywhere a
 * linked person appears — collaborator pills, companion chips, entry owners.
 * Renders plain text (no link) when no userId is available.
 */
function ProfileLink({ userId, displayName, avatarUrl, size = 0, className, style, onClick }) {
  const navigate = useNavigate();
  const name = displayName || "Someone";

  if (!userId) {
    return <span className={className} style={style}>{name}</span>;
  }

  const go = (e) => {
    e.stopPropagation();
    if (onClick) onClick(e);
    navigate(`/u/${userId}`);
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => { if (e.key === "Enter") go(e); }}
      className={className}
      style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: size ? "0.35rem" : 0, ...style }}
    >
      {size > 0 && avatarUrl && (
        <img src={avatarUrl} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />
      )}
      {name}
    </span>
  );
}

export default ProfileLink;
