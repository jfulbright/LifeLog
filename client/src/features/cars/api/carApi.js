// client/src/features/cars/carApi.js
import { getJson } from "helpers/getJson";

export async function fetchCarDataFromVin(vin) {
  const data = await getJson(
    `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
  );

  const result = {
    vin,
    make: "",
    model: "",
    year: "",
  };

  data.Results.forEach((item) => {
    if (item.Variable === "Make") result.make = item.Value || "";
    if (item.Variable === "Model") result.model = item.Value || "";
    if (item.Variable === "Model Year") result.year = item.Value || "";
  });

  return result;
}
