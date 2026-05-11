import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { supabase } from "../services/supabaseClient";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
};

const BUCKET = "photos";

/**
 * Hook for compressing and uploading a photo to Supabase Storage.
 *
 * Usage:
 *   const { uploadPhoto, uploading, uploadError } = usePhotoUpload();
 *   const signedUrl = await uploadPhoto(file, itemId, "photo1");
 *
 * Storage path: {userId}/{itemId}/{slot}.{ext}
 * Upsert: true — re-uploading the same slot replaces the existing file.
 * Returns a 1-year signed URL (not a public URL) — the bucket must be PRIVATE.
 *
 * Supabase setup required:
 *   1. Create a "photos" bucket — set it to PRIVATE (not public).
 *   2. Add an RLS INSERT policy:
 *        auth.uid()::text = (storage.foldername(name))[1]
 *   3. Add an RLS SELECT policy (same expression) so only the owner
 *      can generate signed URLs for their own files.
 */
export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const uploadPhoto = useCallback(async (file, itemId, slot) => {
    if (!file) return null;
    setUploading(true);
    setUploadError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");
      const userId = session.user.id;

      const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

      // Always use .jpg regardless of input format — browser-image-compression
      // outputs a JPEG-compatible blob, and a fixed extension means upsert: true
      // always overwrites the same path when a slot is replaced.
      const pathItemId = itemId || crypto.randomUUID();
      const path = `${userId}/${pathItemId}/${slot}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      // Private bucket: generate a signed URL that expires in 1 year.
      // Only the authenticated owner can generate this URL (enforced by RLS SELECT policy).
      // Once generated, anyone with the URL can view it until it expires —
      // acceptable for personal use. Re-uploading the same slot refreshes the URL.
      const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, ONE_YEAR_SECONDS);

      if (signError) throw signError;
      return signed.signedUrl;
    } catch (err) {
      console.error("[usePhotoUpload]", err);
      const message =
        err.message?.includes("Bucket not found")
          ? "Storage bucket not configured. Create a private 'photos' bucket in Supabase."
          : err.message?.includes("policy")
          ? "Storage permission denied. Check your Supabase RLS policies."
          : "Upload failed. Check your connection and try again.";
      setUploadError(message);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const clearError = useCallback(() => setUploadError(null), []);

  return { uploadPhoto, uploading, uploadError, clearError };
}
