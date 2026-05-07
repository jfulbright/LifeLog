import React from "react";
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

function Dashboard() {
  const allData = categories.map((cat) => ({
    ...cat,
    items: dataService.getItems(cat.key),
    meta: categoryMeta[cat.key] || {},
    statuses: statusLabels[cat.key] || {},
  }));

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

  return (
    <div>
      <h2 className="dashboard-welcome">Welcome to LifeSnaps</h2>

      {totalItems === 0 ? (
        <div className="empty-state">
          <div
            className="empty-state-icon"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            &#128214;
          </div>
          <div className="empty-state-title">Start capturing your life</div>
          <div className="empty-state-text">
            Pick a category to add your first entry.
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
                <h5 style={{ fontWeight: 600, marginBottom: 0 }}>Recent Snapshots</h5>
                <Link to="/snaps" className="text-decoration-none" style={{ fontSize: "var(--font-size-sm)" }}>
                  View all &rarr;
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
                      &ldquo;{snap.snapshot}&rdquo;
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
              <h5 style={{ fontWeight: 600, marginBottom: "1rem" }}>
                Recent Activity
              </h5>
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
