import { getJson } from "../../../helpers/getJson";

const NHTSA_FIELD_MAP = {
  "Make": "make",
  "Model": "model",
  "Model Year": "year",
  "Trim": "trim",
  "Body Class": "bodyClass",
  "Fuel Type - Primary": "fuelType",
  "Engine Model": "engineModel",
  "Engine Number of Cylinders": "engineCylinders",
  "Displacement (L)": "displacement",
  "Drive Type": "driveType",
  "Transmission Style": "transmission",
  "Doors": "doors",
  "Plant Country": "builtIn",
};

export function isValidVin(vin) {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}

export async function fetchCarDataFromVin(vin) {
  const data = await getJson(
    `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
  );

  const result = { vin };

  data.Results.forEach((item) => {
    const fieldName = NHTSA_FIELD_MAP[item.Variable];
    if (fieldName && item.Value && item.Value !== "Not Applicable") {
      result[fieldName] = item.Value;
    }
  });

  return result;
}
