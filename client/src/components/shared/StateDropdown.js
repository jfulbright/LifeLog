import React from "react";
import Select from "react-select";
import { States } from "data/states";

const options = States.map((s) => ({
  value: s.abbreviation,
  label: s.name,
}));

const selectStyles = {
  control: (base) => ({
    ...base,
    minHeight: "38px",
    borderColor: "#dee2e6",
    "&:hover": { borderColor: "#86b7fe" },
  }),
  menu: (base) => ({ ...base, zIndex: 9999 }),
};

function StateDropdown({ value, onChange, name = "state", id, ...props }) {
  const selected = options.find((o) => o.value === value) || null;

  const handleChange = (option) => {
    const syntheticEvent = {
      target: { name, value: option ? option.value : "" },
    };
    onChange(syntheticEvent);
  };

  return (
    <Select
      inputId={id}
      options={options}
      value={selected}
      onChange={handleChange}
      placeholder="Search states..."
      isClearable
      styles={selectStyles}
      aria-label="State"
      {...props}
    />
  );
}

export default StateDropdown;
