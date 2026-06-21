import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { formatDisplayDate } from "../../helpers/dateUtils";
import { getTemplate, tracksMileage as categoryTracksMileage } from "../../helpers/maintenanceTemplates";
import {
  getMaintenance,
  computeDueStatus,
  getCurrentMileage,
} from "../../helpers/maintenanceStatus";
import LogServiceModal from "./LogServiceModal";

const STATUS_STYLE = {
  overdue: { bg: "var(--color-danger-bg, #FDE7EE)", border: "var(--color-danger, #E01E5A)", text: "var(--color-danger, #E01E5A)", label: "Overdue" },
  "due-soon": { bg: "var(--color-warning-bg, #FFF3CD)", border: "var(--color-warning, #ECB22E)", text: "var(--color-warning-text, #856404)", label: "Due soon" },
};

const labelStyle = {
  fontSize: "var(--font-size-xs)",
  fontWeight: 700,
  color: "var(--color-text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "0.5rem",
};

function DueChip({ planItem, dueStatus }) {
  const style = STATUS_STYLE[dueStatus.status];
  if (!style) return null;
  const detail =
    dueStatus.dueMileage != null
      ? ` · due ${dueStatus.dueMileage.toLocaleString()} mi`
      : dueStatus.dueDate
        ? ` · ${formatDisplayDate(dueStatus.dueDate.toISOString().slice(0, 10))}`
        : "";
  return (
    <span
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 10,
        padding: "0.1rem 0.5rem",
        fontSize: "0.75rem",
        color: style.text,
        fontWeight: 600,
      }}
    >
      {planItem.type}: {style.label}{detail}
    </span>
  );
}

function MaintenanceSection({ item, category, canEdit = false, onPersist, currentUserId, currentUserName }) {
  const [showLog, setShowLog] = useState(false);
  const { planAdopted, plan, log } = getMaintenance(item);
  const hasMileage = categoryTracksMileage(category);
  const currentMileage = getCurrentMileage(log);
  const now = new Date();

  // Nothing to show and nothing the viewer can do — stay out of the way.
  if (!planAdopted && log.length === 0 && !canEdit) return null;

  const dueItems = plan
    .map((planItem) => ({ planItem, dueStatus: computeDueStatus(planItem, log, currentMileage, now) }))
    .filter(({ dueStatus }) => dueStatus.status === "overdue" || dueStatus.status === "due-soon")
    .sort((a, b) => (a.dueStatus.status === "overdue" ? -1 : 1));

  const recent = [...log]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 3);

  const handleAdopt = () => {
    const seeded = getTemplate(category).map((t) => ({ id: crypto.randomUUID(), ...t }));
    onPersist({ ...item, maintenance: { planAdopted: true, plan: seeded, log } });
  };

  const handleLog = (entry) => {
    const full = {
      id: crypto.randomUUID(),
      ...entry,
      loggedBy: currentUserId || null,
      loggedByName: currentUserName || null,
      createdAt: new Date().toISOString(),
    };
    onPersist({ ...item, maintenance: { planAdopted, plan, log: [full, ...log] } });
    setShowLog(false);
  };

  return (
    <div style={{ marginBottom: "1.25rem", padding: "0.75rem", background: "var(--color-surface-hover, #f9f9f9)", borderRadius: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <div style={{ ...labelStyle, marginBottom: 0 }}>🔧 Maintenance</div>
        {canEdit && (
          <Button size="sm" variant="outline-primary" onClick={() => setShowLog(true)} style={{ fontSize: "0.75rem", padding: "0.1rem 0.5rem" }}>
            🔧 Log Service
          </Button>
        )}
      </div>

      {!planAdopted && (
        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: canEdit ? "0.5rem" : 0 }}>
          {canEdit ? (
            <>
              <span>Track oil changes, filters, brakes, and recurring issues.</span>
              <div style={{ marginTop: "0.5rem" }}>
                <Button size="sm" variant="primary" onClick={handleAdopt} style={{ fontSize: "0.75rem" }}>
                  Adopt maintenance plan
                </Button>
              </div>
            </>
          ) : (
            <span style={{ fontStyle: "italic", color: "var(--color-text-tertiary)" }}>No maintenance plan yet</span>
          )}
        </div>
      )}

      {planAdopted && (
        <div style={{ marginBottom: recent.length ? "0.75rem" : 0 }}>
          {dueItems.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {dueItems.map(({ planItem, dueStatus }) => (
                <DueChip key={planItem.id} planItem={planItem} dueStatus={dueStatus} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-success, #2EB67D)", fontWeight: 600 }}>
              ✓ All up to date
            </div>
          )}
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.375rem" }}>
            Recent history
          </div>
          {recent.map((entry) => (
            <div key={entry.id} style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>
              <span style={{ fontWeight: 600 }}>{entry.type}</span>
              <span style={{ color: "var(--color-text-tertiary)" }}>
                {" · "}{formatDisplayDate(entry.date)}
                {entry.mileage != null ? ` · ${Number(entry.mileage).toLocaleString()} mi` : ""}
                {entry.cost != null ? ` · $${Number(entry.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                {entry.loggedByName ? ` · ${entry.loggedByName}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      <LogServiceModal
        show={showLog}
        onClose={() => setShowLog(false)}
        onSave={handleLog}
        planTypes={plan.map((p) => p.type)}
        tracksMileage={hasMileage}
        defaultMileage={currentMileage || null}
      />
    </div>
  );
}

export default MaintenanceSection;
