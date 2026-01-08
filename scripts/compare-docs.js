#!/usr/bin/env node

import { spawnSync } from "child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

const printUsage = () => {
  console.log(
    [
      "Usage:",
      "  node scripts/compare-docs.js <old> <new> [options]",
      "",
      "Options:",
      "  --out <path>     Write combined output to a file",
      "  --html <path>    Write an HTML diff file (side-by-side table)",
      "  --side-by-side <path> Write side-by-side text diff",
      "  --word           Use word-level diff markers",
      "  --context <n>    Lines of context for line diffs (default: 3)",
    ].join("\n"),
  );
};

const args = process.argv.slice(2);
if (args.length < 2) {
  printUsage();
  process.exit(1);
}

const oldPath = args[0];
const newPath = args[1];
const flags = args.slice(2);

let outPath = null;
let htmlPath = null;
let sideBySidePath = null;
let wordDiff = false;
let contextLines = 3;

for (let i = 0; i < flags.length; i += 1) {
  const flag = flags[i];

  if (flag === "--out") {
    outPath = flags[i + 1];
    i += 1;
    continue;
  }

  if (flag === "--html") {
    htmlPath = flags[i + 1];
    i += 1;
    continue;
  }

  if (flag === "--side-by-side") {
    sideBySidePath = flags[i + 1];
    i += 1;
    continue;
  }

  if (flag === "--word") {
    wordDiff = true;
    continue;
  }

  if (flag === "--context") {
    const nextValue = Number.parseInt(flags[i + 1], 10);
    if (!Number.isFinite(nextValue) || nextValue < 0) {
      console.error("Invalid --context value:", flags[i + 1]);
      process.exit(1);
    }
    contextLines = nextValue;
    i += 1;
    continue;
  }

  console.error("Unknown option:", flag);
  printUsage();
  process.exit(1);
}

const resolveFilePath = (inputPath) => resolve(process.cwd(), inputPath);
const ensureOutputDirExists = (outputPath) => {
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
};

const resolvedOldPath = resolveFilePath(oldPath);
const resolvedNewPath = resolveFilePath(newPath);

const ensureFileExists = (pathLabel, filePath) => {
  if (!existsSync(filePath)) {
    console.error(`${pathLabel} not found:`, filePath);
    process.exit(1);
  }
  if (!statSync(filePath).isFile()) {
    console.error(`${pathLabel} is not a file:`, filePath);
    process.exit(1);
  }
};

ensureFileExists("Old file", resolvedOldPath);
ensureFileExists("New file", resolvedNewPath);

const runGitDiff = (extraArgs) => {
  const result = spawnSync(
    "git",
    [
      "diff",
      "--no-index",
      "--no-color",
      ...extraArgs,
      "--",
      resolvedOldPath,
      resolvedNewPath,
    ],
    { encoding: "utf-8" },
  );

  if (result.error) {
    console.error("Failed to run git diff:", result.error.message);
    process.exit(1);
  }

  if (result.status === 2) {
    console.error(result.stderr || "git diff failed");
    process.exit(1);
  }

  return result.stdout.trimEnd();
};

const runSideBySideDiff = () => {
  const baseArgs = ["-y"];
  const withWidth = [...baseArgs, "-W", "200", "--", resolvedOldPath, resolvedNewPath];
  const fallback = [...baseArgs, "--", resolvedOldPath, resolvedNewPath];

  let result = spawnSync("diff", withWidth, { encoding: "utf-8" });

  if (result.error) {
    console.error("Failed to run diff:", result.error.message);
    process.exit(1);
  }

  if (result.status && result.status > 1) {
    result = spawnSync("diff", fallback, { encoding: "utf-8" });

    if (result.error) {
      console.error("Failed to run diff:", result.error.message);
      process.exit(1);
    }
  }

  if (result.status && result.status > 1) {
    console.error(result.stderr || "diff failed");
    process.exit(1);
  }

  return result.stdout.trimEnd();
};

const runHtmlDiff = (outputPath) => {
  const contextEnabled = contextLines > 0 ? "True" : "False";
  const pythonScript = `
import difflib
from pathlib import Path

old_path = ${JSON.stringify(resolvedOldPath)}
new_path = ${JSON.stringify(resolvedNewPath)}
out_path = ${JSON.stringify(outputPath)}
context_lines = ${contextLines}

old_lines = Path(old_path).read_text(encoding="utf-8").splitlines()
new_lines = Path(new_path).read_text(encoding="utf-8").splitlines()

diff = difflib.HtmlDiff(tabsize=2, wrapcolumn=90)
html = diff.make_file(
    old_lines,
    new_lines,
    fromdesc=old_path,
    todesc=new_path,
    context=${contextEnabled},
    numlines=context_lines,
)
Path(out_path).write_text(html, encoding="utf-8")
`;

  const pythonCandidates = ["python3", "python"];
  let lastError = null;

  for (const candidate of pythonCandidates) {
    const result = spawnSync(candidate, ["-"], {
      encoding: "utf-8",
      input: pythonScript,
    });

    if (result.error) {
      lastError = result.error;
      continue;
    }

    if (result.status !== 0) {
      console.error(result.stderr || `${candidate} failed`);
      process.exit(1);
    }

    return;
  }

  console.error(
    "Failed to run Python for HTML diff:",
    lastError ? lastError.message : "Python not found",
  );
  process.exit(1);
};

const statOutput = runGitDiff(["--stat"]);
const diffArgs = wordDiff ? ["--word-diff=plain"] : [`--unified=${contextLines}`];
const diffOutput = runGitDiff(diffArgs);

const outputParts = [];
outputParts.push("Diff summary:");
outputParts.push(statOutput || "No differences found.");
outputParts.push("");
outputParts.push("Diff:");
outputParts.push(diffOutput || "No differences found.");

const outputText = outputParts.join("\n");
console.log(outputText);

if (outPath) {
  const resolvedOutPath = resolveFilePath(outPath);
  ensureOutputDirExists(resolvedOutPath);
  writeFileSync(resolvedOutPath, outputText, "utf-8");
  console.log("");
  console.log("Saved diff output to:", resolvedOutPath);
}

if (sideBySidePath) {
  const resolvedSideBySidePath = resolveFilePath(sideBySidePath);
  ensureOutputDirExists(resolvedSideBySidePath);
  const sideBySideOutput = runSideBySideDiff();
  writeFileSync(resolvedSideBySidePath, sideBySideOutput, "utf-8");
  console.log("Saved side-by-side diff to:", resolvedSideBySidePath);
}

if (htmlPath) {
  const resolvedHtmlPath = resolveFilePath(htmlPath);
  ensureOutputDirExists(resolvedHtmlPath);
  runHtmlDiff(resolvedHtmlPath);
  console.log("Saved HTML diff to:", resolvedHtmlPath);
}
