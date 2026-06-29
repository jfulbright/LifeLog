import {
  addVisibilityContact,
  removeVisibilityContact,
  applyCollaborateChange,
  isEveryone,
  toggleEveryone,
  getVisibilityScope,
  setVisibilityScope,
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
    expect(isEveryone([1, 2, 3, 4])).toBe(true);
    expect(isEveryone([1, 2, 3])).toBe(false);
    expect(isEveryone([])).toBe(false);
  });

  test("toggleEveryone selects all rings when not everyone", () => {
    expect(toggleEveryone({ visibilityRings: [1] }).visibilityRings).toEqual([1, 2, 3, 4]);
  });

  test("toggleEveryone clears all rings when already everyone", () => {
    expect(toggleEveryone({ visibilityRings: [1, 2, 3, 4] }).visibilityRings).toEqual([]);
  });
});

describe("visibilitySharing — scope (everyone / custom / private)", () => {
  test("explicit visibilityScope wins over derivation", () => {
    expect(getVisibilityScope({ visibilityScope: "private", visibilityRings: [1, 2, 3, 4] })).toBe("private");
  });

  test("derives everyone / private / custom for legacy entries", () => {
    expect(getVisibilityScope({ visibilityRings: [1, 2, 3, 4] })).toBe("everyone");
    expect(getVisibilityScope({ visibilityRings: [] })).toBe("private");
    expect(getVisibilityScope({ visibilityRings: [1, 2] })).toBe("custom");
    expect(getVisibilityScope({ visibilityRings: [], visibilityContacts: ["c1"] })).toBe("custom");
  });

  test("setVisibilityScope('everyone') selects all rings", () => {
    const out = setVisibilityScope({ visibilityRings: [] }, "everyone");
    expect(out.visibilityScope).toBe("everyone");
    expect(out.visibilityRings).toEqual([1, 2, 3, 4]);
  });

  test("setVisibilityScope('private') clears rings but keeps collaborator contacts", () => {
    const out = setVisibilityScope(
      { visibilityRings: [1, 2, 3, 4], visibilityContacts: ["c1"], shareWithCompanionIds: ["c1"] },
      "private"
    );
    expect(out.visibilityScope).toBe("private");
    expect(out.visibilityRings).toEqual([]);
    expect(out.visibilityContacts).toEqual(["c1"]); // collaborator retained
  });

  test("setVisibilityScope('custom') clears rings only when coming from everyone", () => {
    expect(setVisibilityScope({ visibilityRings: [1, 2, 3, 4] }, "custom").visibilityRings).toEqual([]);
    expect(setVisibilityScope({ visibilityRings: [2] }, "custom").visibilityRings).toEqual([2]);
  });
});
