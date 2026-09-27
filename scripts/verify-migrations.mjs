import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const migrationDir = join(process.cwd(), "supabase", "migrations");
const manifestPath = join(migrationDir, "manifest.sha256");
const files = readdirSync(migrationDir)
  .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
  .sort();
const errors = [];

if (files.length === 0) errors.push("No migrations found");
files.forEach((file, index) => {
  const expected = String(index + 1).padStart(3, "0");
  if (!file.startsWith(`${expected}_`)) {
    errors.push(`Migration sequence gap: expected ${expected}, found ${file}`);
  }
  const sql = readFileSync(join(migrationDir, file), "utf8");
  if (!sql.trim()) errors.push(`${file}: migration is empty`);

  const definerMatches = [...sql.matchAll(/security\s+definer/gi)];
  for (const match of definerMatches) {
    const tail = sql.slice(match.index, match.index + 180);
    if (!/set\s+search_path\s*=\s*(?:public\s*,\s*pg_temp|public)/i.test(tail)) {
      errors.push(`${file}: SECURITY DEFINER without an explicit search_path near offset ${match.index}`);
    }
  }
  if (definerMatches.length > 0 && !/revoke\s+all\s+on\s+function/i.test(sql)) {
    errors.push(`${file}: privileged functions must revoke default PUBLIC execution`);
  }
});

const manifest = files
  .map((file) => {
    const digest = createHash("sha256")
      .update(readFileSync(join(migrationDir, file)))
      .digest("hex");
    return `${digest}  ${file}`;
  })
  .join("\n") + "\n";

if (process.argv.includes("--write")) {
  writeFileSync(manifestPath, manifest);
  console.log(`Wrote ${basename(manifestPath)} for ${files.length} migrations.`);
} else {
  let expectedManifest = "";
  try {
    expectedManifest = readFileSync(manifestPath, "utf8");
  } catch {
    errors.push("Migration manifest is missing; run npm run write:migration-manifest");
  }
  if (expectedManifest && expectedManifest !== manifest) {
    errors.push("Migration checksum mismatch. Never edit an applied migration; append a new migration instead.");
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}
console.log(`Verified ${files.length} contiguous, immutable migrations and privileged-function guards.`);
