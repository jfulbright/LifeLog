import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { formatDisplayDate } from "../../helpers/dateUtils";
import { getTemplate, tracksMileage as categoryTracksMileage } from "../../helpers/maintenanceTemplates";
import {
  getMaintenance,
  computeDueStatus,
  getCurrentMileage,
} from "../../helpers/maintenanceStatus";
import {
  buildReminderSuggestions,
  getUpcomingReminders,
  suggestionKey,
  formatInterval,
  formatNext,
} from "../../helpers/maintenanceReminders";
import LogServiceModal from "./LogServiceModal";
import ReminderEditor from "./ReminderEditor";

function formatNextServiceLabel(reminder, hasMileage) {
  const parts = [];
  if (hasMileage && reminder.nextMileage != null) {
    parts.push(`${Number(reminder.nextMileage).toLocaleString()} mi`);
  }
  if (reminder.nextDate) {
    const d = reminder.nextDate instanceof Date ? reminder.nextDate : new Date(reminder.nextDate);
    parts.push(d.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
  }
  return parts.length ? `${reminder.type} · ${parts.join(" · ")}` : reminder.type;
}

export function NextServiceSummary({ item, hasMileage }) {
  const reminders = getUpcomingReminders(item);
  if (!reminders.length) return null;
  const next = reminders[0];
  return (
    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", fontWeight: 500 }}>
      <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>Next service: </span>
      {formatNextServiceLabel(next, hasMileage)}
    </div>
  );
}

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
  const [editor, setEditor] = useState(null); // { type, initial }
  const { planAdopted, plan, log, dismissedReminders = [] } = getMaintenance(item);
  const hasMileage = categoryTracksMileage(category);
  const currentMileage = getCurrentMileage(log);
  const now = new Date();

  // Nothing to show and nothing the viewer can do — stay out of the way.
  if (!planAdopted && log.length === 0 && !canEdit) return null;

  const dueItems = plan
    .filter((planItem) => planItem.reminderOn !== false)
    .map((planItem) => ({ planItem, dueStatus: computeDueStatus(planItem, log, currentMileage, now) }))
    .filter(({ dueStatus }) => dueStatus.status === "overdue" || dueStatus.status === "due-soon")
    .sort((a, b) => (a.dueStatus.status === "overdue" ? -1 : 1));

  const suggestions = canEdit ? buildReminderSuggestions(item, category) : [];
  const nextReminder = getUpcomingReminders(item)[0] || null;

  const recent = [...log]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 3);

  // ── Persistence helpers (all route through onPersist → saveDetailEdit) ──
  const persistMaintenance = (patch) => {
    onPersist({
      ...item,
      maintenance: { planAdopted, plan, log, dismissedReminders, ...patch },
    });
  };

  const handleAdopt = () => {
    const seeded = getTemplate(category).map((t) => ({ id: crypto.randomUUID(), ...t, reminderOn: true }));
    persistMaintenance({ planAdopted: true, plan: seeded });
  };

  // Last-write-wins: updateSharedItem overwrites the whole maintenance object.
  // Two collaborators logging simultaneously could drop one entry. Acceptable for
  // MVP; a future fix would append server-side rather than replace client-side.
  const handleLog = (entry) => {
    const full = {
      id: crypto.randomUUID(),
      ...entry,
      loggedBy: currentUserId || null,
      loggedByName: currentUserName || null,
      createdAt: new Date().toISOString(),
    };
    persistMaintenance({ log: [full, ...log] });
    setShowLog(false);
  };

  // Apply a reminder schedule to the plan — update the matching item or add one.
  const applyReminder = (type, interval) => {
    const exists = plan.some((p) => p.type === type);
    const nextPlan = exists
      ? plan.map((p) => (p.type === type ? { ...p, ...interval } : p))
      : [...plan, { id: crypto.randomUUID(), type, ...interval }];
    persistMaintenance({ planAdopted: true, plan: nextPlan });
  };

  const acceptSuggestion = (s) => {
    applyReminder(s.type, {
      intervalMiles: s.suggested.intervalMiles,
      intervalMonths: s.suggested.intervalMonths,
      reminderOn: true,
    });
  };

  const dismissSuggestion = (s) => {
    persistMaintenance({ dismissedReminders: [...dismissedReminders, suggestionKey(s)] });
  };

  const openModify = (type, initial) => setEditor({ type, initial });
  const saveEditor = (interval) => {
    if (editor) applyReminder(editor.type, interval);
    setEditor(null);
  };

  const wrap = { marginBottom: "1.25rem", padding: "0.75rem", background: "var(--color-surface-hover, #f9f9f9)", borderRadius: 8 };

  return (
    <div style={wrap}>
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
        <div style={{ marginBottom: "0.75rem" }}>
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
          {nextReminder && formatNext(nextReminder) && (
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.375rem" }}>
              ⏰ Next: {nextReminder.type} · {formatNext(nextReminder)}
            </div>
          )}
        </div>
      )}

      {/* ── Reminder recommendations ── */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: "0.75rem" }}>
          {suggestions.slice(0, 2).map((s) => (
            <div
              key={suggestionKey(s)}
              style={{
                background: "var(--color-info-bg, #EAF6FE)",
                border: "1px solid var(--color-info, #36C5F0)",
                borderRadius: 8,
                padding: "0.5rem 0.625rem",
                marginBottom: "0.375rem",
              }}
            >
              <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)", marginBottom: "0.375rem" }}>
                {s.kind === "tune" ? (
                  <>💡 You service <strong>{s.type}</strong> about every {formatInterval(s.suggested)} — update the reminder?</>
                ) : (
                  <>💡 Set a reminder for <strong>{s.type}</strong>? Suggested every {formatInterval(s.suggested)}.</>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.375rem" }}>
                <Button size="sm" variant="primary" onClick={() => acceptSuggestion(s)} style={{ fontSize: "0.7rem", padding: "0.1rem 0.5rem" }}>Accept</Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => openModify(s.type, { ...s.suggested, reminderOn: true })}
                  style={{ fontSize: "0.7rem", padding: "0.1rem 0.5rem" }}
                >
                  Modify
                </Button>
                <Button size="sm" variant="link" className="text-muted" onClick={() => dismissSuggestion(s)} style={{ fontSize: "0.7rem", padding: "0.1rem 0.25rem" }}>Dismiss</Button>
              </div>
            </div>
          ))}
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

      <ReminderEditor
        show={!!editor}
        onClose={() => setEditor(null)}
        onSave={saveEditor}
        type={editor?.type}
        tracksMileage={hasMileage}
        initial={editor?.initial || {}}
      />
    </div>
  );
}

export default MaintenanceSection;
