import { dedupeCollaboratorRows } from "../helpers/collaboratorDedupe";

describe("dedupeCollaboratorRows (#51)", () => {
  test("collapses same-key duplicate rows to one, keeping most-progressed status", () => {
    const rows = [
      { id: "a", collaborator_contact_id: "ryan", status: "pending" },
      { id: "b", collaborator_contact_id: "ryan", status: "accepted" },
    ];
    const out = dedupeCollaboratorRows(rows);
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe("accepted");
  });

  test("keeps distinct people", () => {
    const rows = [
      { id: "a", collaborator_contact_id: "ryan", status: "pending" },
      { id: "b", collaborator_contact_id: "wife", status: "pending" },
    ];
    expect(dedupeCollaboratorRows(rows)).toHaveLength(2);
  });

  test("merges a resolved user id onto the surviving row", () => {
    const rows = [
      { id: "a", collaborator_contact_id: "ryan", collaborator_user_id: null, status: "pending" },
      { id: "b", collaborator_contact_id: "ryan", collaborator_user_id: "u1", status: "pending" },
    ];
    const out = dedupeCollaboratorRows(rows);
    expect(out).toHaveLength(1);
    expect(out[0].collaborator_user_id).toBe("u1");
  });

  test("drops rows with no person key", () => {
    const rows = [{ id: "a", collaborator_contact_id: null, collaborator_user_id: null, status: "pending" }];
    expect(dedupeCollaboratorRows(rows)).toHaveLength(0);
  });
});
