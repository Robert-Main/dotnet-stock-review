import type { ApiErrorResponse } from "@/lib/types";

/**
 * Look up the first validation message for a form field from the API's
 * structured errors bag. The backend's ModelState keys are PascalCase
 * (e.g. "Email", "Symbol") regardless of the wire JSON casing, so matching is
 * case-insensitive to be robust against field-name drift.
 */
export function fieldError(
  errors: ApiErrorResponse["errors"] | undefined,
  field: string
): string | undefined {
  if (!errors || Array.isArray(errors)) return undefined;
  const needle = field.toLowerCase();
  for (const [key, messages] of Object.entries(errors)) {
    if (key.toLowerCase() === needle) {
      return Array.isArray(messages) && messages.length > 0
        ? messages[0]
        : undefined;
    }
  }
  return undefined;
}

/**
 * True when the errors bag has at least one key that matches a field the form
 * actually renders. Used to decide whether the generic top banner can be
 * suppressed: if the bag only contains keys no rendered field consumes (e.g.
 * the backend's catch-all "Errors" key), the banner must stay visible or the
 * user would get no feedback at all.
 */
export function fieldErrorsMatchAny(
  errors: ApiErrorResponse["errors"] | undefined,
  fields: string[]
): boolean {
  if (!errors || Array.isArray(errors)) return false;
  const needles = new Set(fields.map((f) => f.toLowerCase()));
  return Object.keys(errors).some((key) => needles.has(key.toLowerCase()));
}
