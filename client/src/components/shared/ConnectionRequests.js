import React, { useState, useEffect, useCallback } from "react";
import connectionService from "../../services/connectionService";

/**
 * Incoming connection requests (Epic B / B2 + B2a). Shows pending requests from
 * users who tapped "Connect" on a shared entry you both appear on, with
 * Accept / Decline. Accepting links you both as contacts.
 */
function ConnectionRequests({ onChange }) {
  const [requests, setRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    connectionService.getIncomingRequests().then(setRequests).catch(() => setRequests([]));
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("data-changed", handler);
    return () => window.removeEventListener("data-changed", handler);
  }, [load]);

  const respond = async (id, accept) => {
    setBusyId(id);
    try {
      if (accept) await connectionService.acceptConnection(id);
      else await connectionService.declineConnection(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      onChange?.();
    } catch (err) {
      console.error("[ConnectionRequests] respond failed:", err);
    } finally {
      setBusyId(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #EAF8FE 0%, #F5EEF8 100%)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--card-radius, 8px)",
        padding: "0.875rem 1rem",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ fontSize: "var(--font-size-xs, 0.75rem)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.625rem" }}>
        🤝 Connection requests ({requests.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {requests.map((r) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)", fontWeight: 600 }}>
              {r.display_name || "Someone"} wants to connect
            </span>
            <div style={{ display: "flex", gap: "0.375rem" }}>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => respond(r.id, true)}
                style={{ fontSize: "0.7rem", fontWeight: 700, color: "#fff", background: "var(--color-primary)", border: "none", borderRadius: 10, padding: "0.25rem 0.7rem", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Accept
              </button>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => respond(r.id, false)}
                style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--color-text-secondary)", background: "transparent", border: "1px solid var(--color-border)", borderRadius: 10, padding: "0.25rem 0.7rem", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConnectionRequests;
