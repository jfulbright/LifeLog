import { createContext, useContext } from "react";

/**
 * Viewer mode (Epic D / D5). When set to a userId, category pages render THAT
 * user's items read-only: useCategory loads their data and never persists, add/
 * edit/delete affordances hide, and detail panels become read-only. Null = the
 * normal owner experience.
 */
const ViewerModeContext = createContext(null);

export const ViewerModeProvider = ViewerModeContext.Provider;

/** Returns the profile userId when rendering another user's category page, else null. */
export function useViewerMode() {
  return useContext(ViewerModeContext);
}

export default ViewerModeContext;
