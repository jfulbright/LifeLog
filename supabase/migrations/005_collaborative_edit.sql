-- Add why_notes column to overlays for collaborative wishlist planning
ALTER TABLE overlays ADD COLUMN IF NOT EXISTS why_notes TEXT;

-- Add RLS policy allowing collaborators to edit shared entries
CREATE POLICY "collaborators_can_update_shared_entries"
ON items
FOR UPDATE
USING (
  id IN (
    SELECT entry_id FROM collaborators
    WHERE collaborator_user_id = auth.uid()
      AND status = 'accepted'
      AND can_edit = true
  )
);
