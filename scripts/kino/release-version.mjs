#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";

import {
  CANONICAL_FILE,
  TAG_PREFIX,
  VERSION_FILE,
  compareVersions,
  getTag,
  isReleaseStateAtLeast,
  readReleaseState,
  synchronizeReleaseState,
  writeReleaseState,
} from "./versioning.mjs";

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

function getArgument(name) {
  return process.argv.find((argument) => argument.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
}

function readStateAt(ref) {
  return readReleaseState(runGit(["show", `${ref}:${VERSION_FILE}`]), `${ref}:${VERSION_FILE}`);
}

function latestTaggedVersion() {
  let tags = [];
  try {
    tags = runGit(["tag", "--list", `${TAG_PREFIX}*`])
      .split("\n")
      .map((tag) => tag.trim().slice(TAG_PREFIX.length))
      .filter(Boolean);
  } catch {
    return null;
  }
  return tags.reduce((latest, tag) => (!latest || compareVersions(tag, latest) > 0 ? tag : latest), null);
}

function verify() {
  const current = readReleaseState(fs.readFileSync(VERSION_FILE, "utf8"));
  const canonical = fs.readFileSync(CANONICAL_FILE, "utf8").trim();
  if (compareVersions(canonical, current.version) !== 0) {
    throw new Error(`${CANONICAL_FILE} ${canonical} does not match ${current.version}`);
  }

  const latest = latestTaggedVersion();
  if (latest && compareVersions(current.version, latest) < 0) {
    throw new Error(`android-tv version ${current.version} is lower than the latest tag ${getTag(latest)}`);
  }

  const baselineRef = getArgument("baseline-ref");
  if (baselineRef) {
    const baseline = readStateAt(baselineRef);
    if (!isReleaseStateAtLeast(current, baseline)) {
      throw new Error(
        `android-tv ${current.version} (build ${current.build}) is lower than ${baselineRef} ${baseline.version} (build ${baseline.build})`,
      );
    }
  }

  const tag = getArgument("tag");
  if (tag && tag !== getTag(current.version)) {
    throw new Error(`Tag ${tag} does not match ${getTag(current.version)}`);
  }

  console.log(`Verified android-tv ${current.version} (build ${current.build}).`);
}

function sync() {
  const baseRef = getArgument("base-ref");
  if (!baseRef) throw new Error("sync needs --base-ref=<ref>");
  const content = fs.readFileSync(VERSION_FILE, "utf8");
  const current = readReleaseState(content);
  const nextVersion = fs.readFileSync(CANONICAL_FILE, "utf8").trim();
  const baseline = readStateAt(baseRef);
  const candidate = synchronizeReleaseState(current, nextVersion, baseline);
  if (!isReleaseStateAtLeast(candidate, baseline)) {
    throw new Error(
      `android-tv release state ${candidate.version} (build ${candidate.build}) is lower than ${baseline.version} (build ${baseline.build})`,
    );
  }
  fs.writeFileSync(VERSION_FILE, writeReleaseState(content, candidate));
  console.log(`android-tv ${candidate.version} (build ${candidate.build})`);
}

const command = process.argv[2];
if (command === "verify") verify();
else if (command === "sync") sync();
else {
  console.error("usage: release-version.mjs verify [--tag=] [--baseline-ref=] | sync --base-ref=<ref>");
  process.exit(2);
}
