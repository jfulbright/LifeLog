import React from "react";
import Select from "react-select";
import { CountryList } from "data/countries";

const options = CountryList.map((c) => ({
  value: c.code,
  label: c.name,
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

function CountryDropdown({ value, onChange, name = "country", id, ...props }) {
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
      placeholder="Search countries..."
      isClearable
      styles={selectStyles}
      aria-label="Country"
      {...props}
    />
  );
}

export default CountryDropdown;
