import React, { useState } from "react";
import { Alert } from "react-bootstrap";
import { useAuth } from "contexts/AuthContext";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setInfo(
          "Check your email for a confirmation link, then sign in."
        );
        setMode("signin");
        setPassword("");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
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
      <div
        style={{
          width: "100%",
          maxWidth: 400,
        }}
      >
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
          <p
            style={{
              color: "var(--color-text-secondary, #696969)",
              fontSize: "var(--font-size-sm, 0.875rem)",
              marginTop: "0.25rem",
            }}
          >
            Your life, captured.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px var(--color-border, #EBEAEB)",
            padding: "2rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.125rem",
              letterSpacing: "-0.5px",
              marginBottom: "1.5rem",
              color: "var(--color-text-primary, #1D1C1D)",
            }}
          >
            {mode === "signin" ? "Sign in to your workspace" : "Create your account"}
          </h2>

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
          {info && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setInfo(null)}
              style={{ fontSize: "var(--font-size-sm)", borderRadius: 8 }}
            >
              {info}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="login-email"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-sm, 0.875rem)",
                  fontWeight: 600,
                  marginBottom: "0.375rem",
                  color: "var(--color-text-primary, #1D1C1D)",
                }}
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  border: "1px solid var(--color-border, #EBEAEB)",
                  borderRadius: 6,
                  fontSize: "var(--font-size-base, 1rem)",
                  outline: "none",
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-primary, #4A154B)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(74,21,75,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-border, #EBEAEB)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="login-password"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-sm, 0.875rem)",
                  fontWeight: 600,
                  marginBottom: "0.375rem",
                  color: "var(--color-text-primary, #1D1C1D)",
                }}
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder={mode === "signup" ? "At least 6 characters" : ""}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  border: "1px solid var(--color-border, #EBEAEB)",
                  borderRadius: 6,
                  fontSize: "var(--font-size-base, 1rem)",
                  outline: "none",
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-primary, #4A154B)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(74,21,75,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-border, #EBEAEB)";
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
                transition: "background-color 150ms ease, transform 80ms ease",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "var(--color-primary-hover, #3d1040)";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "var(--color-primary, #4A154B)";
              }}
            >
              {loading
                ? "Please wait…"
                : mode === "signin"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          {/* Toggle */}
          <div
            style={{
              marginTop: "1.25rem",
              textAlign: "center",
              fontSize: "var(--font-size-sm, 0.875rem)",
              color: "var(--color-text-secondary, #696969)",
            }}
          >
            {mode === "signin" ? (
              <>
                New to LifeSnaps?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "var(--color-primary, #4A154B)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "inherit",
                  }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(null); setInfo(null); }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "var(--color-primary, #4A154B)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "inherit",
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
