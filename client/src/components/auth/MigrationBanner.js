import React, { useState, useEffect } from "react";
import { STORAGE_KEYS } from "services/dataService";
import { supabase } from "services/supabaseClient";

const CATEGORY_KEYS = ["concerts", "travel", "cars", "homes"];
const MIGRATION_DONE_KEY = "ls_migrated_to_supabase";

/**
 * Checks if the user has localStorage data that hasn't been imported yet,
 * and offers a one-click migration to Supabase. Shown once at the top of
 * the main content area until the user imports or dismisses.
 */
export default function MigrationBanner() {
  const [hasLocalData, setHasLocalData] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "importing" | "done" | "error"
  const [errorMsg, setErrorMsg] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Already migrated or dismissed this session
    if (localStorage.getItem(MIGRATION_DONE_KEY)) return;

    // Check if any category has localStorage data
    const hasData = CATEGORY_KEYS.some((key) => {
      const raw = localStorage.getItem(STORAGE_KEYS[key]);
      if (!raw) return false;
      try {
        const items = JSON.parse(raw);
        return Array.isArray(items) && items.length > 0;
      } catch {
        return false;
      }
    });
    setHasLocalData(hasData);
  }, []);

  const handleImport = async () => {
    setStatus("importing");
    setErrorMsg(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");
      const userId = session.user.id;

      const rows = [];
      for (const category of CATEGORY_KEYS) {
        const raw = localStorage.getItem(STORAGE_KEYS[category]);
        if (!raw) continue;
        let items;
        try {
          items = JSON.parse(raw);
        } catch {
          continue;
        }
        if (!Array.isArray(items) || items.length === 0) continue;

        for (const item of items) {
          const id = item.id || crypto.randomUUID();
          rows.push({
            id,
            user_id: userId,
            category,
            status: item.status || null,
            start_date: item.startDate || null,
            updated_at: new Date().toISOString(),
            data: { ...item, id },
          });
        }
      }

      if (rows.length > 0) {
        const { error } = await supabase
          .from("items")
          .upsert(rows, { onConflict: "id" });
        if (error) throw error;
      }

      localStorage.setItem(MIGRATION_DONE_KEY, "1");
      setStatus("done");
      setHasLocalData(false);
      window.dispatchEvent(new Event("data-changed"));
    } catch (err) {
      console.error("[MigrationBanner] import failed:", err);
      setErrorMsg(err.message || "Import failed. Please try again.");
      setStatus("error");
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(MIGRATION_DONE_KEY, "1");
    setDismissed(true);
  };

  if (!hasLocalData || dismissed || status === "done") return null;

  return (
    <div
      style={{
        backgroundColor: "var(--color-primary, #4A154B)",
        color: "#fff",
        borderRadius: "var(--card-radius, 8px)",
        padding: "1rem 1.25rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, marginBottom: "0.125rem" }}>
          You have local data to import
        </div>
        <div style={{ fontSize: "var(--font-size-sm, 0.875rem)", opacity: 0.85 }}>
          Your entries are stored locally on this device. Import them now to
          keep them in sync across devices.
        </div>
        {status === "error" && errorMsg && (
          <div
            style={{
              marginTop: "0.5rem",
              fontSize: "var(--font-size-sm, 0.875rem)",
              color: "#FFB3B3",
            }}
          >
            {errorMsg}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <button
          onClick={handleImport}
          disabled={status === "importing"}
          style={{
            backgroundColor: "#fff",
            color: "var(--color-primary, #4A154B)",
            border: "none",
            borderRadius: 6,
            padding: "0.5rem 1rem",
            fontWeight: 700,
            fontSize: "var(--font-size-sm, 0.875rem)",
            cursor: status === "importing" ? "wait" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {status === "importing" ? "Importing…" : "Import my data"}
        </button>
        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 6,
            padding: "0.5rem 0.875rem",
            fontSize: "var(--font-size-sm, 0.875rem)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
