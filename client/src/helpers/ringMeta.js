/**
 * Centralized metadata for the predefined sharing rings.
 * Ring 0 (Only Me) is a privacy state, not a membership ring — not included here.
 * Ring 4 (Public) is deferred to a future discovery phase — not included here.
 */
export const RING_META = {
  1: {
    label: "Inner Circle",
    emoji: "💎",
    description: "Your closest person or people",
    color: "#4A154B",
    bgColor: "#F5EEF8",
    borderColor: "#DDD0E2",
  },
  2: {
    label: "Family",
    emoji: "🏠",
    description: "Immediate and extended family",
    color: "#2EB67D",
    bgColor: "#EAFAF4",
    borderColor: "#B7E8D5",
  },
  3: {
    label: "Friends",
    emoji: "👥",
    description: "Close friends",
    color: "#36C5F0",
    bgColor: "#EAF8FE",
    borderColor: "#B3E7F9",
  },
};

export const RING_LEVELS = [1, 2, 3];

export function getRingMeta(ringLevel) {
  return RING_META[ringLevel] || null;
}

export const INVITE_STATUS_META = {
  local_only: { label: "Added locally", color: "#9E9E9E", dot: "○" },
  invited: { label: "Invited", color: "#ECB22E", dot: "◐" },
  accepted: { label: "On LifeSnaps", color: "#2EB67D", dot: "●" },
  declined: { label: "Declined", color: "#E01E5A", dot: "✕" },
};
