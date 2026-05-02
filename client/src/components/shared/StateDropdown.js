// client/src/components/shared/StateDropdown.js
import React from "react";
import { States } from "data/states"; // [{ name: "Alabama", abbreviation: "AL" }, ...]

function StateDropdown({ value, onChange, name = "state", ...props }) {
  return (
    <select name={name} value={value || ""} onChange={onChange} {...props}>
      <option value="">Select a state</option>
      {States.map((state) => (
        <option key={state.abbreviation} value={state.abbreviation}>
          {state.name}
        </option>
      ))}
    </select>
  );
}

export default StateDropdown;
