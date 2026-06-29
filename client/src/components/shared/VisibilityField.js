import React, { useState } from "react";
import { getVisibilityScope, setVisibilityScope } from "../../helpers/visibilitySharing";
import PeopleField from "./PeopleField";

/**
 * Strava-style "Who can see this" control. Collapsed, it shows the current
 * audience as a single trigger; expanded, it offers Everyone / Specific / Only
 * you. Choosing "Specific" reveals the ring + contact picker inline. Replaces
 * the old always-open ring chip cluster (issues #44, #54).
 */
const OPTIONS = [
  {
    scope: "everyone",
    emoji: "🌐",
    title: "Everyone",
    desc: "Anyone in your network can see this on your profile.",
  },
  {
    scope: "custom",
    emoji: "👥",
    title: "Specific people & rings",
    desc: "Only the rings and people you choose can see this.",
  },
  {
    scope: "private",
    emoji: "🔒",
    title: "Only you",
    desc: "Private. People you actively collaborate with can still see it.",
  },
];

function triggerLabel(scope) {
  if (scope === "everyone") return "🌐 Everyone";
  if (scope === "private") return "🔒 Only you";
  return "👥 Specific people & rings";
}

function VisibilityField({ formData, setFormData }) {
  const [scope, setScope] = useState(() => getVisibilityScope(formData));
  const [open, setOpen] = useState(false);

  function choose(next) {
    setScope(next);
    setFormData((prev) => setVisibilityScope(prev, next));
    // Keep the panel open for "custom" so the picker is reachable; collapse otherwise.
    setOpen(next === "custom");
  }

  return (
    <div className="visibility-field">
      <button
        type="button"
        className="visibility-trigger"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{triggerLabel(scope)}</span>
        <span className="visibility-trigger-chevron" aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="visibility-options" role="radiogroup" aria-label="Who can see this">
          {OPTIONS.map((opt) => {
            const active = scope === opt.scope;
            return (
              <button
                key={opt.scope}
                type="button"
                role="radio"
                aria-checked={active}
                className={`visibility-option${active ? " visibility-option--active" : ""}`}
                onClick={() => choose(opt.scope)}
              >
                <span className={`visibility-option-radio${active ? " visibility-option-radio--on" : ""}`} aria-hidden="true" />
                <span className="visibility-option-body">
                  <span className="visibility-option-title">{opt.emoji} {opt.title}</span>
                  <span className="visibility-option-desc">{opt.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {scope === "custom" && (
        <div className="visibility-custom-picker">
          <PeopleField
            mode="visibility"
            formData={formData}
            setFormData={setFormData}
            showEveryoneButton={false}
          />
        </div>
      )}
    </div>
  );
}

export default VisibilityField;
