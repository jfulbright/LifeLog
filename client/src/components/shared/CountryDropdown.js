// client/src/components/shared/CountryDropdown.js
import React from "react";
import { CountryList } from "data/countries"; // [{ name: "United States", code: "US" }, ...]

function CountryDropdown({ value, onChange, name = "country", ...props }) {
  return (
    <select name={name} value={value || ""} onChange={onChange} {...props}>
      <option value="">Select a country</option>
      {CountryList.map((country) => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}
    </select>
  );
}

export default CountryDropdown;
