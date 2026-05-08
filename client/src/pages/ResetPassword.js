import React, { useState } from "react";
import { Alert } from "react-bootstrap";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

const inputStyle = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  border: "1px solid var(--color-border, #EBEAEB)",
  borderRadius: 6,
  fontSize: "var(--font-size-base, 1rem)",
  outline: "none",
  transition: "border-color 150ms ease, box-shadow 150ms ease",
  boxSizing: "border-box",
};

const focusStyle = {
  borderColor: "var(--color-primary, #4A154B)",
  boxShadow: "0 0 0 3px rgba(74,21,75,0.12)",
};

export default function ResetPassword() {
  const { clearRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => clearRecovery(), 2000);
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg, #F4F4F5)",
        padding: "1rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "var(--color-primary, #4A154B)",
              fontSize: "2rem",
              marginBottom: "1rem",
              boxShadow: "0 4px 16px rgba(74,21,75,0.3)",
            }}
          >
            📸
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.75rem",
              letterSpacing: "-1.5px",
              color: "var(--color-text-primary, #1D1C1D)",
              margin: 0,
            }}
          >
            LifeSnaps
          </h1>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px var(--color-border, #EBEAEB)",
            padding: "2rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.125rem",
              letterSpacing: "-0.5px",
              marginBottom: "0.5rem",
              color: "var(--color-text-primary, #1D1C1D)",
            }}
          >
            Set a new password
          </h2>
          <p
            style={{
              fontSize: "var(--font-size-sm, 0.875rem)",
              color: "var(--color-text-secondary, #696969)",
              marginBottom: "1.5rem",
            }}
          >
            Choose a new password for your account.
          </p>

          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError(null)}
              style={{ fontSize: "var(--font-size-sm)", borderRadius: 8 }}
            >
              {error}
            </Alert>
          )}

          {success ? (
            <Alert variant="success" style={{ borderRadius: 8 }}>
              Password updated! Signing you in...
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="reset-password"
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-sm, 0.875rem)",
                    fontWeight: 600,
                    marginBottom: "0.375rem",
                    color: "var(--color-text-primary, #1D1C1D)",
                  }}
                >
                  New password
                </label>
                <input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => {
                    e.target.style.borderColor =
                      "var(--color-border, #EBEAEB)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="reset-confirm"
                  style={{
                    display: "block",
                    fontSize: "var(--font-size-sm, 0.875rem)",
                    fontWeight: 600,
                    marginBottom: "0.375rem",
                    color: "var(--color-text-primary, #1D1C1D)",
                  }}
                >
                  Confirm new password
                </label>
                <input
                  id="reset-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat your new password"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => {
                    e.target.style.borderColor =
                      "var(--color-border, #EBEAEB)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: loading
                    ? "var(--color-text-tertiary, #9E9E9E)"
                    : "var(--color-primary, #4A154B)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "var(--font-size-base, 1rem)",
                  letterSpacing: "-0.25px",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background-color 150ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading)
                    e.currentTarget.style.backgroundColor =
                      "var(--color-primary-hover, #3d1040)";
                }}
                onMouseLeave={(e) => {
                  if (!loading)
                    e.currentTarget.style.backgroundColor =
                      "var(--color-primary, #4A154B)";
                }}
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
