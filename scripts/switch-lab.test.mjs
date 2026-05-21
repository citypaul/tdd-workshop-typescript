import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDirtyWorktreeMessage,
  buildSuccessMessage,
  getLabConfig,
} from "./switch-lab.mjs";

test("maps lab aliases to checkpoint tags and next commands", () => {
  assert.equal(getLabConfig("lab1").tag, "lab-1-start");
  assert.equal(getLabConfig("1").tag, "lab-1-start");
  assert.equal(getLabConfig("lab-2").tag, "lab-2-start");
  assert.equal(getLabConfig("3").tag, "lab-3-start");

  assert.equal(
    getLabConfig("lab3").nextCommand,
    "pnpm test:card:watch --project=browser",
  );
});

test("rejects unknown labs with a useful message", () => {
  assert.throws(() => getLabConfig("lab4"), /Unknown lab "lab4"/);
});

test("success message explains detached lab checkpoint and next command", () => {
  const message = buildSuccessMessage(getLabConfig("lab1"));

  assert.match(message, /Checked out lab-1-start/);
  assert.match(message, /detached lab checkpoint/);
  assert.match(message, /pnpm test:card:watch --project=unit/);
});

test("dirty worktree message tells participants how to protect their work", () => {
  const message = buildDirtyWorktreeMessage(" M spec/lab-1.md\n");

  assert.match(message, /uncommitted changes/);
  assert.match(message, /commit or stash/);
  assert.match(message, /M spec\/lab-1\.md/);
});
