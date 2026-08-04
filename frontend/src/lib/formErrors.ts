import type { ApiErrorResponse } from "@/lib/types";

/**
 * The subset of react-hook-form's setError signature we rely on. Field names
 * are per-form literals, so callers cast their strongly-typed setError to this
 * loose shape (safe: we only pass field names the form actually registers).
 */
export type ServerErrorSetter = (
  name: string,
  error: { type: string; message: string }
) => void;

/**
 * Map the API's structured { Field: string[] } errors bag into
 * react-hook-form's per-field errors. The backend's ModelState keys are
 * PascalCase (e.g. "Email", "Symbol") regardless of the wire JSON casing, so
 * matching is case-insensitive against the form's field names.
 *
 * Returns the first matched validation message (for a toast), or null when
 * nothing matched — in which case the caller should surface the generic
 * `message` via its banner, or the bag was flat/absent.
 */
export function syncServerErrors(
  errors: ApiErrorResponse["errors"] | undefined,
  setError: ServerErrorSetter,
  fields: string[]
): string | null {
  if (!errors || Array.isArray(errors)) return null;
  const needles = new Map(fields.map((f) => [f.toLowerCase(), f]));
  let firstMessage: string | null = null;
  for (const [key, messages] of Object.entries(errors)) {
    const field = needles.get(key.toLowerCase());
    if (field && Array.isArray(messages) && messages.length > 0) {
      setError(field, { type: "server", message: messages[0] });
      if (!firstMessage) firstMessage = messages[0];
    }
  }
  return firstMessage;
}
