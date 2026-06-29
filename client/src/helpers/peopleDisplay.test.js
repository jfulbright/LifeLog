import { getPeopleWithCollabStatus } from "./peopleDisplay";

const contacts = [
  { id: "ryan", displayName: "Ryan", ringLevel: 3, linkedUserId: "u-ryan" },
  { id: "wife", displayName: "Wife", ringLevel: 1, linkedUserId: "u-wife" },
  { id: "sister", displayName: "Sister", ringLevel: 3, linkedUserId: null },
];

describe("getPeopleWithCollabStatus (#53)", () => {
  test("a companion who is also a collaborator appears once, marked collaborator", () => {
    const companions = [{ type: "contact", contactId: "ryan", displayName: "Ryan" }];
    const collaborators = [{ id: "1", collaborator_contact_id: "ryan", collaborator_user_id: "u-ryan", status: "pending" }];
    const out = getPeopleWithCollabStatus(companions, collaborators, contacts);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ displayName: "Ryan", isCollaborator: true, status: "pending" });
  });

  test("cross-key duplicate (contact row + linked-user row) collapses to one person", () => {
    const companions = [{ type: "contact", contactId: "ryan", displayName: "Ryan" }];
    const collaborators = [
      { id: "1", collaborator_contact_id: "ryan", collaborator_user_id: null, status: "pending" },
      { id: "2", collaborator_contact_id: null, collaborator_user_id: "u-ryan", status: "pending" },
    ];
    const out = getPeopleWithCollabStatus(companions, collaborators, contacts);
    expect(out.filter((p) => p.displayName === "Ryan")).toHaveLength(1);
  });

  test("the owner row is excluded", () => {
    const collaborators = [{ id: "owner-x", _isOwner: true, collaborator_user_id: "owner-x", status: "accepted" }];
    expect(getPeopleWithCollabStatus([], collaborators, contacts)).toHaveLength(0);
  });

  test("freetext companions are kept and never marked as collaborators", () => {
    const out = getPeopleWithCollabStatus(["Grandpa"], [], contacts);
    expect(out).toEqual([
      { key: "name:grandpa", displayName: "Grandpa", ringLevel: null, isCollaborator: false, status: null },
    ]);
  });

  test("a collaborator who wasn't a companion is still included", () => {
    const collaborators = [{ id: "3", collaborator_contact_id: "wife", collaborator_user_id: "u-wife", status: "accepted" }];
    const out = getPeopleWithCollabStatus([], collaborators, contacts);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ displayName: "Wife", isCollaborator: true, status: "accepted" });
  });
});
