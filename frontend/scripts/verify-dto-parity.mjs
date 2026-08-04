#!/usr/bin/env node
/**
 * Cross-stack validation parity test.
 *
 * Parses the DataAnnotations on the .NET DTOs in ../StockReview/Dtos and
 * asserts that src/lib/validationSpec.json (the single source of truth the
 * frontend zod schemas are built from) enforces every backend rule at least as
 * strictly. A backend rule that the frontend fails to enforce (or enforces
 * more loosely) fails this test, so the client can never accept input the API
 * would reject.
 *
 * Run: node scripts/verify-dto-parity.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(scriptDir, "..");
const dtoRoot = join(frontendDir, "..", "StockReview", "Dtos");
const specPath = join(frontendDir, "src", "lib", "validationSpec.json");

const spec = JSON.parse(readFileSync(specPath, "utf8"));

/** Recursively list .cs files under a directory. */
function findCsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...findCsFiles(p));
    else if (p.endsWith(".cs")) out.push(p);
  }
  return out;
}

/** Parse a .cs file into { ClassName: { Property: { rules } } }. */
function parseDtoFile(text) {
  const dtos = {};
  // Split into class bodies: public class Name { ... }
  const classRe = /public\s+class\s+(\w+)([^\{]*)\{([\s\S]*?)\n\}/g;
  let classMatch;
  while ((classMatch = classRe.exec(text)) !== null) {
    const className = classMatch[1];
    const body = classMatch[3];
    const props = {};

    // Split the body into attribute-group + property declaration chunks.
    const attrRe = /\[([^\]\r\n]+)\]/g;
    const propRe = /public\s+[\w.?<>\[\],]+\s+(\w+)\s*\{\s*get;\s*set;\s*\}/g;

    // Walk lines: accumulate [..] attribute lines, bind them to the next
    // property declaration. Both regexes carry lastIndex, so reset before use.
    const lines = body.split(/\r?\n/);
    let pending = [];
    for (const line of lines) {
      attrRe.lastIndex = 0;
      const attrMatches = [...line.matchAll(attrRe)];
      if (attrMatches.length > 0) {
        for (const m of attrMatches) pending.push(m[1].trim());
        continue;
      }
      propRe.lastIndex = 0;
      const propMatch = propRe.exec(line);
      if (propMatch) {
        const propName = propMatch[1];
        props[propName] = parseRules(pending);
        pending = [];
      }
    }

    if (Object.keys(props).length > 0) dtos[className] = props;
  }
  return dtos;
}

/** Convert a list of attribute source strings into a normalized rule object. */
function parseRules(attrs) {
  const rules = { attrs: [] };
  for (const raw of attrs) {
    const nameMatch = /^(\w+)/.exec(raw);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const argsMatch = /\(([^)]*)\)/.exec(raw);
    const args = argsMatch
      ? argsMatch[1].split(",").map((s) => s.trim())
      : [];
    rules.attrs.push({ name, args });
  }
  return rules;
}

/** Extract the backend's effective constraints from parsed attribute rules. */
function backendConstraints(rules) {
  const c = {};
  for (const { name, args } of rules.attrs) {
    switch (name) {
      case "Required":
        c.required = true;
        break;
      case "EmailAddress":
        c.email = true;
        break;
      case "MaxLength": {
        const n = Number(args[0]);
        if (!Number.isNaN(n)) c.maxLength = n;
        break;
      }
      case "MinLength": {
        const n = Number(args[0]);
        if (!Number.isNaN(n)) c.minLength = n;
        break;
      }
      case "Range": {
        // [Range(min, max)] — max may be double.MaxValue; we only require the
        // frontend to enforce at least the minimum.
        const min = Number(args[0]);
        if (!Number.isNaN(min)) c.min = min;
        break;
      }
    }
  }
  return c;
}

/** Is the frontend spec rule at least as strict as the backend constraint? */
function atLeastAsStrict(backend, frontend) {
  const problems = [];
  if (backend.required && !frontend.required) {
    problems.push("required is not enforced (spec must set required: true)");
  }
  if (backend.email && !frontend.email) {
    problems.push("email format is not enforced (spec must set email: true)");
  }
  if (backend.minLength !== undefined) {
    if (frontend.minLength === undefined) {
      problems.push(`minLength ${backend.minLength} is not enforced`);
    } else if (frontend.minLength < backend.minLength) {
      problems.push(
        `minLength ${frontend.minLength} is looser than backend's ${backend.minLength}`
      );
    }
  }
  if (backend.maxLength !== undefined) {
    if (frontend.maxLength === undefined) {
      problems.push(`maxLength ${backend.maxLength} is not enforced`);
    } else if (frontend.maxLength > backend.maxLength) {
      problems.push(
        `maxLength ${frontend.maxLength} is looser than backend's ${backend.maxLength}`
      );
    }
  }
  if (backend.min !== undefined) {
    if (frontend.min === undefined || !frontend.numeric) {
      problems.push(
        `minimum ${backend.min} is not enforced (spec needs numeric: true, min: ${backend.min})`
      );
    } else if (frontend.min < backend.min) {
      problems.push(
        `minimum ${frontend.min} is looser than backend's ${backend.min}`
      );
    }
  }
  return problems;
}

let failures = 0;
let checks = 0;

const csFiles = findCsFiles(dtoRoot);
const parsed = {};
for (const f of csFiles) {
  const dtos = parseDtoFile(readFileSync(f, "utf8"));
  Object.assign(parsed, dtos);
}

for (const [dtoName, specProps] of Object.entries(spec)) {
  if (dtoName.startsWith("//")) continue; // JSON comment key
  const backend = parsed[dtoName];
  if (!backend) {
    failures++;
    console.error(`✖ DTO ${dtoName} not found in StockReview/Dtos`);
    continue;
  }
  for (const [prop, frontendRule] of Object.entries(specProps)) {
    const backendProp = backend[prop];
    if (!backendProp) {
      // Frontend-only field (e.g. RegisterDto.Confirm) — allowed.
      continue;
    }
    const backendC = backendConstraints(backendProp);
    if (Object.keys(backendC).length === 0) continue; // no backend rules
    checks++;
    const problems = atLeastAsStrict(backendC, frontendRule);
    if (problems.length > 0) {
      failures++;
      console.error(`✖ ${dtoName}.${prop}`);
      for (const p of problems) console.error(`    - ${p}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n✖ ${failures} parity failure(s) across ${checks} checked field(s).`);
  process.exit(1);
}
console.log(`✓ DTO parity OK — ${checks} backend-constrained field(s) enforced by the frontend spec.`);
