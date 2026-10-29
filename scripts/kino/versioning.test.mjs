import assert from "node:assert/strict";
import test from "node:test";

import { createReleaseManifest } from "./release-manifest.mjs";
import {
  compareVersions,
  getTag,
  isReleaseStateAtLeast,
  readReleaseState,
  synchronizeReleaseState,
  writeReleaseState,
} from "./versioning.mjs";

const PROPERTIES = "# x-release-please-start-version\r\nversionName=0.1.0\r\n# x-release-please-end\r\nversionCode=2\r\n";

test("reads and writes the release state without touching line endings", () => {
  assert.deepEqual(readReleaseState(PROPERTIES), { version: "0.1.0", build: 2 });
  const next = writeReleaseState(PROPERTIES, { version: "0.2.0", build: 3 });
  assert.equal(next, PROPERTIES.replace("0.1.0", "0.2.0").replace("versionCode=2", "versionCode=3"));
});

test("raises the version code once when the version rises", () => {
  const baseline = { version: "0.1.0", build: 2 };
  assert.deepEqual(synchronizeReleaseState(baseline, "0.2.0", baseline), { version: "0.2.0", build: 3 });
  const bumped = { version: "0.2.0", build: 3 };
  assert.deepEqual(synchronizeReleaseState(bumped, "0.2.0", baseline), { version: "0.2.0", build: 3 });
  assert.deepEqual(synchronizeReleaseState(baseline, "0.1.0", baseline), baseline);
});

test("refuses to move the version backwards", () => {
  assert.throws(() => synchronizeReleaseState({ version: "0.2.0", build: 3 }, "0.1.9"));
  assert.ok(!isReleaseStateAtLeast({ version: "0.2.0", build: 2 }, { version: "0.1.0", build: 3 }));
});

test("orders prereleases before releases", () => {
  assert.equal(compareVersions("0.1.0-beta.2", "0.1.0"), -1);
  assert.equal(compareVersions("0.1.0-beta.10", "0.1.0-beta.2"), 1);
  assert.equal(compareVersions("1.0.0", "0.9.9"), 1);
});

test("names tags and manifests for the TV component", () => {
  assert.equal(getTag("0.1.0"), "android-tv-v0.1.0");
  const manifest = createReleaseManifest({
    version: "0.1.0",
    versionCode: 2,
    assets: [{ name: "Kino-TV-0.1.0.apk", sizeBytes: 1, sha256: "00" }],
  });
  assert.equal(manifest.platform, "android-tv");
  assert.equal(manifest.versionCode, 2);
  assert.throws(() => createReleaseManifest({ version: "0.1.0", assets: [] }));
});
