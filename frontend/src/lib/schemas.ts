import { z } from "zod";
import spec from "./validationSpec.json" with { type: "json" };

type FieldRule = {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  numeric?: boolean;
  min?: number;
  pattern?: string;
};

// The JSON carries a "//" comment key; the cast tolerates it and lookups only
// ever use known DTO names, so the key is never touched.
type Spec = Record<string, Record<string, FieldRule>>;
const DTO = spec as unknown as Spec;

/**
 * Build a zod string schema from a spec rule. Backend ModelState messages are
 * PascalCase-keyed; the RHF field names follow per-form conventions, so rules
 * are looked up by their .NET property name and messages use the UI label.
 */
function field(
  dto: string,
  property: string,
  label: string,
  extra?: Partial<FieldRule>
): z.ZodString {
  const rule: FieldRule = { ...DTO[dto][property], ...extra };
  // Required is enforced as a length check so an empty value fails with the
  // "required" message. minLength adds a *separate* refine (not a second
  // .min()) so it never replaces the required check.
  let s = rule.required
    ? z.string().min(1, `${label} is required`)
    : z.string();

  if (rule.minLength && rule.minLength > 1) {
    s = s.refine(
      (v) => v.length >= (rule.minLength ?? 0),
      `${label} must be at least ${rule.minLength} characters`
    );
  }
  if (rule.maxLength)
    s = s.max(rule.maxLength, `${label} must be ${rule.maxLength} characters or fewer`);
  if (rule.email)
    s = s.regex(/^\S+@\S+\.\S+$/, "Enter a valid email address");
  if (rule.pattern)
    s = s.regex(new RegExp(rule.pattern), `${label} has an invalid format`);
  if (rule.numeric && rule.min !== undefined) {
    s = s.refine(
      (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= (rule.min ?? 0)),
      `${label} must be ${rule.min} or greater`
    );
  }
  return s;
}

/* ------------------------------------------------------------------ */
/* Login                                                                */
/* ------------------------------------------------------------------ */

export const loginSchema = z.object({
  email: field("LoginDto", "Email", "Email"),
  password: field("LoginDto", "Password", "Password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

/* ------------------------------------------------------------------ */
/* Register                                                             */
/* ------------------------------------------------------------------ */

export const registerSchema = z
  .object({
    username: field("RegisterDto", "Username", "Username"),
    email: field("RegisterDto", "Email", "Email"),
    password: field("RegisterDto", "Password", "Password"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;


export const stockCreateSchema = z.object({
  Symbol: field("CreateStock", "Symbol", "Symbol"),
  CompanyName: field("CreateStock", "CompanyName", "Company name"),
  Purchase: field("CreateStock", "Purchase", "Purchase price"),
  Divided: field("CreateStock", "Divided", "Dividend"),
  LastDiv: field("CreateStock", "LastDiv", "Last dividend"),
  Industry: field("CreateStock", "Industry", "Industry"),
  Sector: field("CreateStock", "Sector", "Sector"),
  MarketCap: field("CreateStock", "MarketCap", "Market cap (USD)"),
});
export type StockCreateValues = z.infer<typeof stockCreateSchema>;

export const stockUpdateSchema = z.object({
  Symbol: field("UpdateStock", "Symbol", "Symbol"),
  CompanyName: field("UpdateStock", "CompanyName", "Company name"),
  Purchase: field("UpdateStock", "Purchase", "Purchase price"),
  Divided: field("UpdateStock", "Divided", "Dividend"),
  LastDiv: field("UpdateStock", "LastDiv", "Last dividend"),
  Industry: field("UpdateStock", "Industry", "Industry"),
  MarketCap: field("UpdateStock", "MarketCap", "Market cap (USD)"),
});
export type StockUpdateValues = z.infer<typeof stockUpdateSchema>;

/* ------------------------------------------------------------------ */
/* Comment (create + edit share the same field rules)                  */
/* ------------------------------------------------------------------ */

export const commentSchema = z.object({
  title: field("CreateCommentDto", "Title", "Title"),
  content: field("CreateCommentDto", "Content", "Review"),
});
export type CommentValues = z.infer<typeof commentSchema>;

/* ------------------------------------------------------------------ */
/* Portfolio add-symbol (no backend DTO — frontend-only rule)          */
/* ------------------------------------------------------------------ */

export const portfolioSymbolSchema = z.object({
  symbol: z
    .string()
    .min(1, "Enter a symbol")
    .max(10, "Symbol must be 10 characters or fewer")
    .regex(
      /^[A-Za-z0-9.-]+$/,
      "Symbol may only contain letters, digits, dots (BRK.B) or hyphens."
    ),
});
export type PortfolioSymbolValues = z.infer<typeof portfolioSymbolSchema>;
