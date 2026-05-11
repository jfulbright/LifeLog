import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import inviteService from "../services/inviteService";
import profileService from "../services/profileService";

function InviteWelcome() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [inviterProfile, setInviterProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const inv = await inviteService.getInviteByToken(token);
        if (!inv) {
          setError("This invite link is invalid or has expired.");
          setLoading(false);
          return;
        }
        setInvite(inv);

        const profile = await profileService.getProfileByUserId(inv.inviter_id);
        setInviterProfile(profile);
      } catch (err) {
        setError("Failed to load invite.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <div style={{ color: "var(--color-text-tertiary)" }}>Loading invite...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>&#128683;</div>
        <h4 style={{ fontWeight: 700 }}>Invite Not Found</h4>
        <p style={{ color: "var(--color-text-secondary)" }}>{error}</p>
        <Button variant="primary" onClick={() => navigate("/")}>
          Go to LifeSnaps
        </Button>
      </div>
    );
  }

  const inviterName = inviterProfile?.display_name || invite?.invitee_name || "Someone";

  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: 480, margin: "0 auto" }}>
      {/* Inviter avatar */}
      <div style={{ marginBottom: "1.5rem" }}>
        {inviterProfile?.avatar_url ? (
          <img
            src={inviterProfile.avatar_url}
            alt=""
            style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "var(--color-primary)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            {inviterName[0]?.toUpperCase()}
          </div>
        )}
      </div>

      <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
        {inviterName} invited you to LifeSnaps
      </h3>

      {invite.shared_entry_count > 0 && (
        <p style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)" }}>
          You have <strong>{invite.shared_entry_count} shared {invite.shared_entry_count === 1 ? "memory" : "memories"}</strong> waiting.
        </p>
      )}

      {invite.message && (
        <div
          style={{
            fontStyle: "italic",
            color: "var(--color-text-secondary)",
            margin: "1.5rem 0",
            padding: "1rem",
            background: "var(--color-bg)",
            borderRadius: 8,
          }}
        >
          "{invite.message}"
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate("/")}
          style={{ borderRadius: 8, fontWeight: 600, padding: "0.75rem 2rem" }}
        >
          Join LifeSnaps
        </Button>
        <div style={{ marginTop: "0.75rem", fontSize: "var(--font-size-sm)", color: "var(--color-text-tertiary)" }}>
          Free forever. Your memories, your way.
        </div>
      </div>
    </div>
  );
}

export default InviteWelcome;
