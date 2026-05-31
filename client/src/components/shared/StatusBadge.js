import React from "react";
import { Badge } from "react-bootstrap";
import { getStatusLabel } from "../../helpers/statusLabels";

export function getStatusBadgeVariant(status) {
  switch (status) {
    case "attended":
    case "visited":
    case "owned":
    case "watched":
    case "done":
    case "tried":
    case "happened":
      return "success";
    case "wishlist":
    case "watchlist":
      return "primary";
    case "upcoming":
    case "rented":
    case "cellar":
      return "info";
    default:
      return "secondary";
  }
}

function StatusBadge({ category, status, className = "" }) {
  if (!status) return null;
  const variant = getStatusBadgeVariant(status);
  const label = getStatusLabel(category, status);
  return (
    <Badge
      bg={variant}
      className={`badge-status flex-shrink-0 ${className}`.trim()}
    >
      {label}
    </Badge>
  );
}

export default StatusBadge;
