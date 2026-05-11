import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

function InviteWelcome() {
  const { token } = useParams();
  const [invite, setInvite] = useState(null);
  const [inviterName, setInviterName] = useState("Someone");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // Fetch invite directly (public RLS policy allows this)
        const { data: inv, error: invErr } = await supabase
          .from("invites")
          .select("*")
          .eq("token", token)
          .single();

        if (invErr || !inv) {
          setError("This invite link is invalid or has expired.");
          setLoading(false);
          return;
        }
        setInvite(inv);

        // Try to fetch inviter profile (may fail without auth -- that's OK)
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", inv.inviter_id)
            .single();
          if (profile?.display_name) {
            setInviterName(profile.display_name);
          }
        } catch {
          // Profile not accessible without auth -- use invite data
          if (inv.invitee_name) setInviterName(inv.invitee_name);
        }
      } catch (err) {
        setError("Failed to load invite.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  // Count of shared entries (from the invite record)
  const sharedCount = invite?.shared_entry_count || 0;

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ color: "#696969" }}>Loading invite...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: 480, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>&#128683;</div>
        <h4 style={{ fontWeight: 700 }}>Invite Not Found</h4>
        <p style={{ color: "#696969" }}>{error}</p>
        <a href="/" style={{ color: "#4A154B", fontWeight: 600 }}>
          Go to LifeSnaps
        </a>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: 480, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Brand */}
      <div style={{ marginBottom: "2rem" }}>
        <span style={{ fontSize: "2.5rem" }}>📸</span>
        <div style={{ fontSize: "0.875rem", color: "#696969", marginTop: "0.25rem" }}>LifeSnaps</div>
      </div>

      {/* Inviter avatar */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#4A154B",
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
      </div>

      <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#1D1C1D" }}>
        {inviterName} invited you to LifeSnaps
      </h3>

      <p style={{ fontSize: "1rem", color: "#696969", marginBottom: "1.5rem" }}>
        A place to capture life's moments with the people who matter most.
      </p>

      {sharedCount > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #F5EEF8 0%, #EAF8FE 100%)",
            border: "1px solid #EBEAEB",
            borderRadius: 12,
            padding: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎁</div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1D1C1D" }}>
            {sharedCount} shared {sharedCount === 1 ? "memory" : "memories"} waiting for you
          </div>
          <div style={{ fontSize: "0.875rem", color: "#696969", marginTop: "0.25rem" }}>
            {inviterName} wants to share experiences with you. Sign up to see them.
          </div>
        </div>
      )}

      {invite.message && (
        <div
          style={{
            fontStyle: "italic",
            color: "#696969",
            margin: "0 0 2rem",
            padding: "1rem",
            background: "#F4F4F5",
            borderRadius: 8,
          }}
        >
          "{invite.message}"
        </div>
      )}

      <div>
        <a
          href="/"
          style={{
            display: "inline-block",
            background: "#4A154B",
            color: "#fff",
            padding: "0.875rem 2.5rem",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
          }}
        >
          Join LifeSnaps
        </a>
        <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#9E9E9E" }}>
          Free forever. Your memories, your way.
        </div>
      </div>
    </div>
  );
}

export default InviteWelcome;
