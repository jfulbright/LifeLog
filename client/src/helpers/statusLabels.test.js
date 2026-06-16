import {
  getStatusValues,
  getStatusLabel,
  getStatusOptionLabels,
  getStatusField,
} from "./statusLabels";

describe("statusLabels — single source of truth", () => {
  test("getStatusOptionLabels returns the value→label map for a category", () => {
    expect(getStatusOptionLabels("activities")).toEqual({
      done: "Accomplished",
      wishlist: "Wishlist",
    });
  });

  test("getStatusOptionLabels returns a copy (not the internal object)", () => {
    const a = getStatusOptionLabels("activities");
    a.done = "Mutated";
    expect(getStatusOptionLabels("activities").done).toBe("Accomplished");
  });

  test("getStatusOptionLabels is empty for an unknown category", () => {
    expect(getStatusOptionLabels("nope")).toEqual({});
  });

  test("getStatusField wires options + optionLabels from the same source", () => {
    const field = getStatusField("activities");
    expect(field.name).toBe("status");
    expect(field.type).toBe("select");
    expect(field.options).toEqual(getStatusValues("activities"));
    // The dropdown labels must match what badges/filters render.
    field.options.forEach((value) => {
      expect(field.optionLabels[value]).toBe(getStatusLabel("activities", value));
    });
    // Regression for #3: "done" must read "Accomplished", never "Done".
    expect(field.optionLabels.done).toBe("Accomplished");
  });

  test("getStatusField applies overrides", () => {
    const field = getStatusField("travel", { section: "Other", order: 5 });
    expect(field.section).toBe("Other");
    expect(field.order).toBe(5);
  });
});
