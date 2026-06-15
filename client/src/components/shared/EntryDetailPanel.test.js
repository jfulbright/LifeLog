import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EntryDetailPanel from "./EntryDetailPanel";
import collaboratorService from "../../services/collaboratorService";

// Regression test for the "share toggle reads off on re-edit" bug: the detail
// panel must hydrate shareWithCompanionIds from the collaborators table so the
// "Share & Collaborate" toggle reflects live shares (and a save doesn't wipe them).

jest.mock("../../services/collaboratorService", () => ({
  __esModule: true,
  default: { getCollaboratorsForOwnedEntry: jest.fn() },
}));

jest.mock("../../contexts/AppDataContext", () => ({
  useAppData: () => ({
    contacts: [{ id: "c1", displayName: "Wife", linkedUserId: "u-wife" }],
  }),
}));

// Stub the heavy schema-driven form: surface the hydrated share ids as text.
jest.mock("./ItemForm", () => ({
  __esModule: true,
  default: ({ formData }) => (
    <div data-testid="itemform">
      share:{JSON.stringify(formData.shareWithCompanionIds || [])}
    </div>
  ),
}));
jest.mock("./EntryHeader", () => ({ __esModule: true, default: () => null }));
jest.mock("./ReadOnlySocialSection", () => ({ __esModule: true, default: () => null }));
jest.mock("./EntryView", () => ({
  __esModule: true,
  default: ({ onEdit }) => (
    <button type="button" onClick={onEdit}>
      EditStub
    </button>
  ),
}));

const item = {
  id: "entry-1",
  title: "Aspen Trip",
  _isShared: false,
  companions: [{ type: "contact", contactId: "c1", displayName: "Wife" }],
};

test("hydrates the share toggle from collaborator rows when editing an owned entry", async () => {
  collaboratorService.getCollaboratorsForOwnedEntry.mockResolvedValue([
    { collaborator_contact_id: "c1", collaborator_user_id: "u-wife", status: "accepted" },
  ]);

  render(
    <EntryDetailPanel
      item={item}
      category="travel"
      schema={[]}
      onClose={() => {}}
      onSave={() => {}}
      onDelete={() => {}}
    />
  );

  // Enter edit mode so the (stubbed) ItemForm renders the hydrated formData.
  fireEvent.click(screen.getByText("EditStub"));

  await waitFor(() => {
    expect(collaboratorService.getCollaboratorsForOwnedEntry).toHaveBeenCalledWith("entry-1");
    expect(screen.getByTestId("itemform").textContent).toContain('share:["c1"]');
  });
});

test("does not hydrate shares for a shared (collaborator) entry", async () => {
  collaboratorService.getCollaboratorsForOwnedEntry.mockClear();

  render(
    <EntryDetailPanel
      item={{ ...item, _isShared: true }}
      category="travel"
      schema={[]}
      onClose={() => {}}
      onSave={() => {}}
      onDelete={() => {}}
    />
  );

  // _isShared entries don't own the share list; the panel must not fetch it.
  expect(collaboratorService.getCollaboratorsForOwnedEntry).not.toHaveBeenCalled();
});
