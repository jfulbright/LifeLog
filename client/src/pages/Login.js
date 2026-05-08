import React, { useState } from "react";
import { Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { signIn, signUp, sendPasswordReset, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"
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
      } else if (mode === "signup") {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setInfo("Check your email for a confirmation link, then sign in.");
        setMode("signin");
        setPassword("");
      } else if (mode === "forgot") {
        const { error } = await sendPasswordReset(email);
        if (error) throw error;
        setInfo("Password reset email sent — check your inbox.");
        setMode("signin");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message || "Google sign-in failed.");
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
            {mode === "signin"
              ? "Sign in to your workspace"
              : mode === "signup"
              ? "Create your account"
              : "Reset your password"}
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

          {/* Google sign-in — only shown in signin/signup modes */}
          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  backgroundColor: "#fff",
                  color: "var(--color-text-primary, #1D1C1D)",
                  border: "1px solid var(--color-border, #EBEAEB)",
                  borderRadius: 6,
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "var(--font-size-base, 1rem)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginBottom: "1.25rem",
                  transition: "background-color 150ms ease, border-color 150ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--color-surface-hover, #F8F8F8)";
                  e.currentTarget.style.borderColor = "#aaa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "var(--color-border, #EBEAEB)";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ flex: 1, height: 1, backgroundColor: "var(--color-border, #EBEAEB)" }} />
                <span style={{ fontSize: "var(--font-size-sm, 0.875rem)", color: "var(--color-text-tertiary, #9E9E9E)" }}>
                  or
                </span>
                <div style={{ flex: 1, height: 1, backgroundColor: "var(--color-border, #EBEAEB)" }} />
              </div>
            </>
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

            {/* Password field — hidden in forgot mode */}
            {mode !== "forgot" && (
              <div style={{ marginBottom: "0.5rem" }}>
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
            )}

            {/* Forgot password link — only in signin mode */}
            {mode === "signin" && (
              <div style={{ textAlign: "right", marginBottom: "1.25rem" }}>
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(null); setInfo(null); }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "var(--color-text-secondary, #696969)",
                    fontSize: "var(--font-size-sm, 0.875rem)",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {mode !== "signin" && <div style={{ marginBottom: "1.25rem" }} />}

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
                : mode === "signup"
                ? "Create account"
                : "Send reset email"}
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
                {mode === "forgot" ? "Remember it? " : "Already have an account? "}
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
