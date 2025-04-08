// components/shared/ItemExtras.js
import React from "react";

/**
 * Displays extra information for a list item, like photo links.
 * Extendable for other link types, tags, icons, etc.
 */
export default function ItemExtras({ item }) {
  return (
    <div className="mt-2">
      {item.photoLink && (
        <a
          href={item.photoLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline block"
        >
          View Photos
        </a>
      )}

      {/* Future extras can go here */}
    </div>
  );
}
