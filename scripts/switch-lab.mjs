#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const labConfigs = {
  lab1: {
    name: "Lab 1",
    tag: "lab-1-start",
    specPath: "spec/lab-1.md",
    testPath: "src/card-validator/validate-card.test.ts",
    nextCommand: "pnpm test:card:watch --project=unit",
  },
  lab2: {
    name: "Lab 2",
    tag: "lab-2-start",
    specPath: "spec/lab-2.md",
    testPath: "src/card-validator/validate-card.test.ts",
    nextCommand: "pnpm test:card:watch --project=unit",
  },
  lab3: {
    name: "Lab 3",
    tag: "lab-3-start",
    specPath: "spec/lab-3.md",
    testPath: "src/card-validator/app/App.test.tsx",
    nextCommand: "pnpm test:card:watch --project=browser",
  },
};

const labAliases = {
  1: "lab1",
  "lab-1": "lab1",
  lab1: "lab1",
  2: "lab2",
  "lab-2": "lab2",
  lab2: "lab2",
  3: "lab3",
  "lab-3": "lab3",
  lab3: "lab3",
};

export function getLabConfig(rawLab) {
  const lab = String(rawLab ?? "")
    .trim()
    .toLowerCase();
  const key = labAliases[lab];

  if (!key) {
    throw new Error(
      `Unknown lab "${rawLab ?? ""}". Expected one of: lab1, lab2, lab3.`,
    );
  }

  return labConfigs[key];
}

export function buildDirtyWorktreeMessage(status) {
  return [
    "Cannot switch labs because you have uncommitted changes.",
    "",
    "Please commit or stash your work before moving to another lab checkpoint.",
    "",
    "Current changes:",
    status.trimEnd(),
  ].join("\n");
}

export function buildSuccessMessage(config) {
  return [
    `Checked out ${config.tag} for ${config.name}.`,
    "",
    "You are now on a detached lab checkpoint. That is intentional for the workshop.",
    "",
    `Open the spec: ${config.specPath}`,
    `Start in: ${config.testPath}`,
    "",
    "Run the tests in watch mode:",
    config.nextCommand,
  ].join("\n");
}

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  });

  if (result.status !== 0) {
    const detail =
      result.stderr || result.stdout || `git ${args.join(" ")} failed`;
    throw new Error(detail.trim());
  }

  return result.stdout;
}

function main(argv) {
  const config = getLabConfig(argv[2]);
  const status = runGit(["status", "--porcelain"]);

  if (status.trim() !== "") {
    throw new Error(buildDirtyWorktreeMessage(status));
  }

  runGit(["rev-parse", "--verify", `refs/tags/${config.tag}`]);
  runGit(["switch", "--detach", config.tag], { stdio: "inherit" });

  console.log(buildSuccessMessage(config));
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    main(process.argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
