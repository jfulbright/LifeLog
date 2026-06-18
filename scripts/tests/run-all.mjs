process.env.TEST_ORCHESTRATED = "1";

import { resetAllTestData, seedBaselineContacts } from "./helpers/cleanup.mjs";
import { resetResults, getResults } from "./helpers/assertions.mjs";
import { resetCounter } from "./helpers/factories.mjs";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const resultsDir = join(__dirname, "results");

const TEST_FILES = [
  { name: "01-entry-creation", path: "./01-entry-creation.test.mjs" },
  { name: "02-collaboration-flow", path: "./02-collaboration-flow.test.mjs" },
  { name: "03-recommendation-flow", path: "./03-recommendation-flow.test.mjs" },
  { name: "04-ring-visibility", path: "./04-ring-visibility.test.mjs" },
  { name: "05-edit-and-overlay", path: "./05-edit-and-overlay.test.mjs" },
  { name: "06-delete-and-leave", path: "./06-delete-and-leave.test.mjs" },
  { name: "07-isolation-security", path: "./07-isolation-security.test.mjs" },
  { name: "08-scale-performance", path: "./08-scale-performance.test.mjs" },
  { name: "10-deferred-share", path: "./10-deferred-share.test.mjs" },
  { name: "11-visibility-contact-reads", path: "./11-visibility-contact-reads.test.mjs" },
];

async function runAll() {
  const startTime = Date.now();
  console.log("\n\x1b[1m╔══════════════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[1m║   LifeSnaps Social Integration Test Suite        ║\x1b[0m");
  console.log("\x1b[1m╚══════════════════════════════════════════════════╝\x1b[0m\n");

  // ── Phase 1: Cleanup ──
  console.log("\x1b[1m▸ Phase 1: Cleanup & Seed\x1b[0m\n");
  try {
    await resetAllTestData();
    await seedBaselineContacts();
  } catch (err) {
    console.error(`\n\x1b[31mFATAL: Cleanup failed: ${err.message}\x1b[0m`);
    process.exit(1);
  }

  // ── Phase 2: Run tests ──
  console.log("\n\x1b[1m▸ Phase 2: Execute Tests\x1b[0m");

  const allResults = [];
  const fileResults = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const testFile of TEST_FILES) {
    resetResults();
    resetCounter();
    try {
      const module = await import(testFile.path);
      const results = getResults();
      const passed = results.filter(r => r.status === "PASS").length;
      const failed = results.filter(r => r.status === "FAIL").length;
      const skipped = results.filter(r => r.status === "SKIP").length;

      totalPassed += passed;
      totalFailed += failed;
      totalSkipped += skipped;

      fileResults.push({ name: testFile.name, passed, failed, skipped, results });
      allResults.push(...results.map(r => ({ ...r, file: testFile.name })));
    } catch (err) {
      console.error(`\n\x1b[31m  ERROR in ${testFile.name}: ${err.message}\x1b[0m\n`);
      fileResults.push({ name: testFile.name, passed: 0, failed: 1, skipped: 0, error: err.message });
      totalFailed += 1;
      allResults.push({ name: `${testFile.name} (CRASH)`, status: "FAIL", detail: err.message, file: testFile.name });
    }
  }

  // ── Phase 3: Summary ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n\x1b[1m╔══════════════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[1m║   FINAL RESULTS                                  ║\x1b[0m");
  console.log("\x1b[1m╠══════════════════════════════════════════════════╣\x1b[0m");

  for (const fr of fileResults) {
    const status = fr.failed > 0 ? "\x1b[31m✗\x1b[0m" : "\x1b[32m✓\x1b[0m";
    console.log(`  ${status} ${fr.name.padEnd(30)} ${fr.passed}P ${fr.failed}F ${fr.skipped}S`);
  }

  console.log("\x1b[1m╠══════════════════════════════════════════════════╣\x1b[0m");
  console.log(`  \x1b[1mTotal: \x1b[32m${totalPassed} passed\x1b[0m, \x1b[31m${totalFailed} failed\x1b[0m, \x1b[33m${totalSkipped} skipped\x1b[0m  (${elapsed}s)`);
  console.log("\x1b[1m╚══════════════════════════════════════════════════╝\x1b[0m\n");

  if (totalFailed > 0) {
    console.log("\x1b[31m  Failed tests:\x1b[0m");
    allResults
      .filter(r => r.status === "FAIL")
      .forEach(r => console.log(`    • [${r.file}] ${r.name}: ${r.detail}`));
    console.log("");
  }

  // ── Write results to file ──
  mkdirSync(resultsDir, { recursive: true });

  const output = {
    timestamp: new Date().toISOString(),
    elapsed: `${elapsed}s`,
    totals: { passed: totalPassed, failed: totalFailed, skipped: totalSkipped },
    files: fileResults,
    results: allResults,
  };

  writeFileSync(join(resultsDir, "latest.json"), JSON.stringify(output, null, 2));

  // Write human-readable summary
  const summaryLines = [
    `# Test Run — ${new Date().toISOString().split("T")[0]}`,
    "",
    `**Totals:** ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped (${elapsed}s)`,
    "",
    "## Results by File",
    "",
    ...fileResults.map(fr => `- **${fr.name}**: ${fr.passed}P / ${fr.failed}F / ${fr.skipped}S${fr.error ? ` (CRASH: ${fr.error})` : ""}`),
    "",
  ];

  const failures = allResults.filter(r => r.status === "FAIL");
  if (failures.length > 0) {
    summaryLines.push("## Failures", "");
    for (const f of failures) {
      summaryLines.push(`- **BUG** [${f.file}] ${f.name} — ${f.detail}`);
    }
    summaryLines.push("");
  }

  const skips = allResults.filter(r => r.status === "SKIP");
  if (skips.length > 0) {
    summaryLines.push("## Skipped", "");
    for (const s of skips) {
      summaryLines.push(`- [${s.file}] ${s.name} — ${s.detail}`);
    }
    summaryLines.push("");
  }

  writeFileSync(join(resultsDir, "latest-summary.md"), summaryLines.join("\n"));
  console.log(`  Results written to scripts/tests/results/latest.json`);
  console.log(`  Summary written to scripts/tests/results/latest-summary.md\n`);

  // ── Phase 3: Post-run cleanup ──
  console.log("\x1b[1m▸ Phase 3: Cleanup\x1b[0m\n");
  try {
    await resetAllTestData();
    await seedBaselineContacts();
    console.log("  ✓ Test data cleaned up — DB left with baseline contacts only\n");
  } catch (err) {
    console.error(`  WARN: Post-run cleanup failed: ${err.message}\n`);
  }

  if (totalFailed > 0) process.exit(1);
}

runAll().catch(err => {
  console.error(`\x1b[31mFatal error: ${err.message}\x1b[0m`);
  process.exit(1);
});
