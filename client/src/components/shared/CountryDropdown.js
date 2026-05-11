import React from "react";
import Select from "react-select";
import { CountryList, codeToFlag } from "../../data/countries";

const options = CountryList.map((c) => ({
  value: c.code,
  label: c.name,
  continent: c.continent,
  flag: codeToFlag(c.code),
}));

const formatOptionLabel = ({ flag, label }) => (
  <span>
    <span style={{ marginRight: "0.5em", fontSize: "1.1em" }}>{flag}</span>
    {label}
  </span>
);

const selectStyles = {
  control: (base) => ({
    ...base,
    minHeight: "38px",
    borderColor: "#dee2e6",
    "&:hover": { borderColor: "#86b7fe" },
  }),
  menu: (base) => ({ ...base, zIndex: 9999 }),
};

/**
 * Flag-first country picker. Fires onChange with a synthetic event for the country
 * ISO code, and also calls onFullChange({ code, name, continent }) when available.
 */
function CountryDropdown({ value, onChange, onFullChange, name = "country", id, ...props }) {
  const selected = options.find((o) => o.value === value) || null;

  const handleChange = (option) => {
    const syntheticEvent = {
      target: { name, value: option ? option.value : "" },
    };
    onChange(syntheticEvent);
    if (onFullChange) {
      onFullChange(
        option
          ? { code: option.value, name: option.label, continent: option.continent }
          : null
      );
    }
  };

  return (
    <Select
      inputId={id}
      options={options}
      value={selected}
      onChange={handleChange}
      placeholder="🌍 Search countries..."
      isClearable
      styles={selectStyles}
      formatOptionLabel={formatOptionLabel}
      aria-label="Country"
      {...props}
    />
  );
}

export default CountryDropdown;
