/**
 * Runtime check for the real, built zod schemas in src/lib/schemas.ts.
 *
 * Complements scripts/verify-dto-parity.mjs: the parity script proves the
 * validation spec covers every .NET DataAnnotation, and this script feeds
 * canonical valid/invalid payloads through the *actual* schemas so a hand-edit
 * that loosens a rule in schemas.ts (bypassing the spec) is caught.
 *
 * Run: node --experimental-strip-types scripts/verify-schemas-runtime.mts
 */
import {
  loginSchema,
  registerSchema,
  stockCreateSchema,
  commentSchema,
  portfolioSymbolSchema,
} from "../src/lib/schemas.ts";

let failures = 0;
let checks = 0;
function t(name: string, ok: boolean) {
  checks++;
  if (!ok) {
    failures++;
    console.error(`✖ ${name}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

// Login
t("login: empty rejects", !loginSchema.safeParse({ email: "", password: "" }).success);
t("login: bad email rejects", !loginSchema.safeParse({ email: "nope", password: "x" }).success);
t("login: valid accepts", loginSchema.safeParse({ email: "a@b.co", password: "x" }).success);

// Register
const reg = { username: "abc", email: "a@b.co", password: "Passw0rd!", confirm: "Passw0rd!" };
t("register: valid accepts", registerSchema.safeParse(reg).success);
t("register: password mismatch rejects", !registerSchema.safeParse({ ...reg, confirm: "other" }).success);
t("register: short username rejects", !registerSchema.safeParse({ ...reg, username: "ab" }).success);

// Stock create
const st = {
  Symbol: "AAPL",
  CompanyName: "Apple",
  Purchase: "1",
  Divided: "0",
  LastDiv: "0",
  Industry: "Tech",
  Sector: "Tech",
  MarketCap: "1",
};
t("stock create: valid accepts", stockCreateSchema.safeParse(st).success);
t("stock create: empty symbol rejects", !stockCreateSchema.safeParse({ ...st, Symbol: "" }).success);
t("stock create: negative price rejects", !stockCreateSchema.safeParse({ ...st, Purchase: "-1" }).success);
t("stock create: symbol over 10 chars rejects", !stockCreateSchema.safeParse({ ...st, Symbol: "ABCDEFGHIJK" }).success);
t("stock create: invalid symbol chars rejects", !stockCreateSchema.safeParse({ ...st, Symbol: "AA PL" }).success);

// Comment
t("comment: valid accepts", commentSchema.safeParse({ title: "t", content: "c" }).success);
t("comment: empty title rejects", !commentSchema.safeParse({ title: "", content: "c" }).success);
t("comment: content over 200 rejects", !commentSchema.safeParse({ title: "t", content: "x".repeat(201) }).success);

// Portfolio
t("portfolio: valid accepts", portfolioSymbolSchema.safeParse({ symbol: "BRK.B" }).success);
t("portfolio: spaces rejects", !portfolioSymbolSchema.safeParse({ symbol: "A B" }).success);

if (failures > 0) {
  console.error(`\n✖ ${failures} runtime schema failure(s) across ${checks} check(s).`);
  process.exit(1);
}
console.log(`\n✓ Schema runtime OK — ${checks} canonical payload check(s) pass against the real schemas.`);
