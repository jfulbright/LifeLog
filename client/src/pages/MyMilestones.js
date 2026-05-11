import React, { useState, useEffect } from "react";
import { Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import collaboratorService from "../services/collaboratorService";
import categoryMeta from "../helpers/categoryMeta";
import { getStatusLabel } from "../helpers/statusLabels";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function MyMilestones() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const shared = await collaboratorService.getSharedEntries();
        setEntries(shared.sort((a, b) => (b.startDate || "").localeCompare(a.startDate || "")));
      } catch (err) {
        console.error("[MyMilestones] load error:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const groupedByYear = entries.reduce((acc, entry) => {
    const date = entry.startDate || entry.createdAt;
    const year = date ? new Date(date).getFullYear() : "Unknown";
    if (!acc[year]) acc[year] = [];
    acc[year].push(entry);
    return acc;
  }, {});

  const years = Object.keys(groupedByYear).sort((a, b) =>
    a === "Unknown" ? 1 : b === "Unknown" ? -1 : Number(b) - Number(a)
  );

  if (loading) return null;

  return (
    <div>
      <h4 style={{ fontWeight: 700, marginBottom: "0.25rem" }}>My Milestones</h4>
      <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
        Memories your family shared with you. Add your own perspective with a Snapshot.
      </p>

      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "#FF6B35", color: "#fff" }}>
            🌟
          </div>
          <div className="empty-state-title">No milestones shared yet</div>
          <div className="empty-state-text">
            When your family shares memories with you, they'll appear here. You can add your own Snapshots and photos to any of them.
          </div>
          <Link to="/shared" className="btn btn-outline-primary btn-sm">
            Check Shared Experiences
          </Link>
        </div>
      ) : (
        years.map((year) => (
          <div key={year} style={{ marginBottom: "2rem" }}>
            <div style={{
              fontWeight: 800,
              fontSize: "1.1rem",
              color: "#FF6B35",
              paddingBottom: "0.375rem",
              borderBottom: "2px solid #FF6B35",
              marginBottom: "0.75rem",
            }}>
              {year}
            </div>
            {groupedByYear[year].map((entry, i) => {
              const meta = categoryMeta[entry._category] || {};
              const displayTitle = meta.getPrimaryDisplay
                ? meta.getPrimaryDisplay(entry)
                : entry.title || entry[meta.primaryField] || "Milestone";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderLeft: `4px solid ${meta.color || "#FF6B35"}`,
                    borderRadius: "var(--card-radius, 8px)",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "1.25rem" }}>{meta.icon || "🌟"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {displayTitle}
                    </div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                      {formatDate(entry.startDate)} {entry._category && `· ${entry._category}`}
                    </div>
                    {entry.snapshot1 && (
                      <div style={{
                        marginTop: "0.25rem",
                        fontSize: "var(--font-size-sm)",
                        color: "var(--color-text-secondary)",
                        fontStyle: "italic",
                      }}>
                        "{entry.snapshot1}"
                      </div>
                    )}
                  </div>
                  {entry.status && (
                    <Badge bg="secondary" style={{ fontSize: "0.6rem" }}>
                      {getStatusLabel(entry._category, entry.status)}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

export default MyMilestones;
