import React from "react";
import VisibilitySummary from "./VisibilitySummary";

function SharingInfo({ item, navigate }) {
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
        {"🔒"} Who can see this
      </div>
      <VisibilitySummary item={item} navigate={navigate} />
    </div>
  );
}

export default SharingInfo;
