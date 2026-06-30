import {
  addVisibilityContact,
  removeVisibilityContact,
  applyCollaborateChange,
  isEveryone,
  toggleEveryone,
} from "./visibilitySharing";

describe("visibilitySharing — collaborate ⟹ visible (#6)", () => {
  test("enabling collaborate adds the person to Who can see this", () => {
    const before = { shareWithCompanionIds: [], visibilityContacts: [] };
    const after = applyCollaborateChange(before, ["c1"]);
    expect(after.shareWithCompanionIds).toEqual(["c1"]);
    expect(after.visibilityContacts).toContain("c1");
  });

  test("disabling collaborate leaves them visible (manual removal)", () => {
    const before = { shareWithCompanionIds: ["c1"], visibilityContacts: ["c1"] };
    const after = applyCollaborateChange(before, []);
    expect(after.shareWithCompanionIds).toEqual([]);
    expect(after.visibilityContacts).toEqual(["c1"]); // still visible
  });

  test("removing from Who can see this also turns collaborate off", () => {
    const before = { shareWithCompanionIds: ["c1", "c2"], visibilityContacts: ["c1", "c2"] };
    const after = removeVisibilityContact(before, "c1");
    expect(after.visibilityContacts).toEqual(["c2"]);
    expect(after.shareWithCompanionIds).toEqual(["c2"]); // c1 collaborate dropped
  });

  test("enabling collaborate does not duplicate an already-visible contact", () => {
    const before = { shareWithCompanionIds: [], visibilityContacts: ["c1"] };
    const after = applyCollaborateChange(before, ["c1"]);
    expect(after.visibilityContacts).toEqual(["c1"]);
  });

  test("addVisibilityContact is idempotent and does not touch sharing", () => {
    const before = { visibilityContacts: ["c1"], shareWithCompanionIds: [] };
    expect(addVisibilityContact(before, "c1")).toBe(before);
    const after = addVisibilityContact(before, "c2");
    expect(after.visibilityContacts).toEqual(["c1", "c2"]);
    expect(after.shareWithCompanionIds).toEqual([]);
  });
});

describe("visibilitySharing — Everyone (#7)", () => {
  test("isEveryone is true only when all rings are selected", () => {
    expect(isEveryone([1, 2, 3, 4, 5])).toBe(true);
    expect(isEveryone([1, 2, 3, 4])).toBe(false);
    expect(isEveryone([])).toBe(false);
  });

  test("toggleEveryone selects all rings when not everyone", () => {
    expect(toggleEveryone({ visibilityRings: [1] }).visibilityRings).toEqual([1, 2, 3, 4, 5]);
  });

  test("toggleEveryone clears all rings when already everyone", () => {
    expect(toggleEveryone({ visibilityRings: [1, 2, 3, 4, 5] }).visibilityRings).toEqual([]);
  });
});
