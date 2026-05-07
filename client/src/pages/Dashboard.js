import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Badge, Button } from "react-bootstrap";
import categoryMeta from "helpers/categoryMeta";
import statusLabels from "helpers/statusLabels";
import { getStatusLabel } from "helpers/statusLabels";
import { getSnapshotTeaser } from "helpers/operator";
import dataService, { STORAGE_KEYS } from "services/dataService";

const categories = Object.keys(STORAGE_KEYS).map((key) => ({
  key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good afternoon", emoji: "🌤" };
  return { text: "Good evening", emoji: "🌙" };
}

function Dashboard() {
  const greeting = getGreeting();
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const loaded = await Promise.all(
        categories.map(async (cat) => ({
          ...cat,
          items: await dataService.getItems(cat.key),
          meta: categoryMeta[cat.key] || {},
          statuses: statusLabels[cat.key] || {},
        }))
      );
      if (!cancelled) {
        setAllData(loaded);
        setLoading(false);
      }
    }
    load();
    const refresh = () => load();
    window.addEventListener("data-changed", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("data-changed", refresh);
    };
  }, []);

  const recentActivity = allData
    .flatMap((cat) =>
      cat.items.map((item) => ({
        category: cat.key,
        label: cat.label,
        meta: cat.meta,
        title:
          item[cat.meta.primaryField] ||
          item.artist ||
          item.title ||
          item.type ||
          item.make ||
          "Untitled",
        status: item.status,
        date: item.startDate || item.createdAt || "",
      }))
    )
    .filter((a) => a.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const recentSnapshots = allData
    .flatMap((cat) =>
      cat.items.map((item) => {
        const snap = getSnapshotTeaser(item);
        if (!snap) return null;
        return {
          category: cat.key,
          label: cat.label,
          meta: cat.meta,
          title:
            item[cat.meta.primaryField] ||
            item.artist ||
            item.title ||
            item.type ||
            item.make ||
            "Untitled",
          snapshot: snap,
          date: item.startDate || item.createdAt || "",
          color: (categoryMeta[cat.key] || {}).color || "var(--color-primary)",
        };
      })
    )
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const totalItems = allData.reduce((sum, c) => sum + c.items.length, 0);

  if (loading) return null;

  return (
    <div>
      {/* Aubergine gradient banner strip */}
      <div className="dashboard-aubergine-banner" />

      <h2 className="dashboard-welcome">
        {greeting.text}, LifeSnapper {greeting.emoji}
      </h2>
      <p className="dashboard-welcome-sub">Your life, captured.</p>

      {totalItems === 0 ? (
        <div className="empty-state">
          <div
            className="empty-state-icon"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            📸
          </div>
          <div className="empty-state-title">Start capturing your life 🚀</div>
          <div className="empty-state-text">
            Pick a category below to add your first entry.
          </div>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            {allData.map((cat) => (
              <Button
                key={cat.key}
                as={Link}
                to={`/${cat.key}`}
                variant="outline-primary"
                size="sm"
              >
                {cat.meta.icon} {cat.label}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Recent snapshots scroll row */}
          {recentSnapshots.length > 0 && (
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="dashboard-section-header">
                  <span className="dashboard-channel-name">recent-snapshots</span>
                  <span style={{ fontSize: "var(--font-size-sm)" }}>📸</span>
                </div>
                <Link to="/snaps" className="text-decoration-none" style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                  View all →
                </Link>
              </div>
              <div className="snapshot-scroll-row">
                {recentSnapshots.map((snap, i) => (
                  <div
                    key={i}
                    className="snapshot-scroll-card"
                    style={{ borderLeftColor: snap.color }}
                  >
                    <div className="snapshot-scroll-quote">
                      &#10024; &ldquo;{snap.snapshot}&rdquo;
                    </div>
                    <div className="snapshot-scroll-source">
                      {snap.title} &middot; {snap.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category summary cards */}
          <div className="dashboard-section-header mb-2">
            <span className="dashboard-channel-name">life-categories</span>
            <span style={{ fontSize: "var(--font-size-sm)" }}>🗂️</span>
          </div>
          <Row className="g-3 mb-4">
            {allData.map((cat) => {
              const statusKeys = Object.keys(cat.statuses);
              return (
                <Col sm={6} lg={3} key={cat.key}>
                  <Link
                    to={`/${cat.key}`}
                    className="category-summary-card"
                    style={{ borderLeftColor: cat.meta.color }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="category-name">
                          <span className="me-2">{cat.meta.icon}</span>
                          {cat.label}
                        </div>
                        <div className="category-breakdown mt-1">
                          {statusKeys.map((s) => {
                            const count = cat.items.filter(
                              (i) => i.status === s
                            ).length;
                            if (count === 0) return null;
                            return (
                              <span key={s} className="me-2">
                                {count} {getStatusLabel(cat.key, s).toLowerCase()}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="category-count">{cat.items.length}</div>
                    </div>
                  </Link>
                </Col>
              );
            })}
          </Row>

          {/* Recent activity */}
          {recentActivity.length > 0 && (
            <div>
              <div className="dashboard-section-header mb-3">
                <span className="dashboard-channel-name">recent-activity</span>
                <span style={{ fontSize: "var(--font-size-sm)" }}>⚡</span>
              </div>
              <div className="card">
                <div style={{ padding: "var(--spacing-card-padding)" }}>
                  {recentActivity.map((entry, i) => (
                    <div key={i} className="activity-item">
                      <div
                        className="activity-dot"
                        style={{ backgroundColor: entry.meta.color }}
                      />
                      <div className="activity-date">
                        {formatShortDate(entry.date)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong>{entry.title}</strong>
                        <span className="text-muted"> &middot; {entry.label}</span>
                      </div>
                      {entry.status && (
                        <Badge
                          bg={
                            ["attended", "visited", "owned"].includes(entry.status)
                              ? "success"
                              : entry.status === "wishlist"
                              ? "warning"
                              : "secondary"
                          }
                          className={`badge-status ${
                            entry.status === "wishlist" ? "text-dark" : ""
                          }`}
                        >
                          {getStatusLabel(entry.category, entry.status)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default Dashboard;
