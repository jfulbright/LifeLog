import { isMineOnly, isSharedSource } from "./operator";

describe("source-filter classification (#4)", () => {
  test("a plain owned item is Mine, not Shared", () => {
    const item = { id: "1" };
    expect(isMineOnly(item)).toBe(true);
    expect(isSharedSource(item)).toBe(false);
  });

  test("an item received from someone else is Shared", () => {
    const item = { id: "1", _isShared: true };
    expect(isSharedSource(item)).toBe(true);
    expect(isMineOnly(item)).toBe(false);
  });

  test("an owned item shared outward (even pending) is Shared, not Mine", () => {
    const item = { id: "1", _hasOutgoingShares: true };
    expect(isSharedSource(item)).toBe(true);
    expect(isMineOnly(item)).toBe(false);
  });

  test("isMineOnly and isSharedSource are exact complements", () => {
    const cases = [
      {},
      { _isShared: true },
      { _hasOutgoingShares: true },
      { _isShared: true, _hasOutgoingShares: true },
    ];
    cases.forEach((item) => {
      expect(isMineOnly(item)).toBe(!isSharedSource(item));
    });
  });
});
