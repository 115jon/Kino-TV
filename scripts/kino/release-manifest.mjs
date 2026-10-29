#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function createReleaseManifest({ version, versionCode, channel = "stable", mandatory = false, assets }) {
  if (!version || !Array.isArray(assets) || assets.length === 0) {
    throw new Error("A version and at least one asset are required.");
  }
  return {
    schemaVersion: 1,
    product: "kino",
    platform: "android-tv",
    channel,
    version,
    ...(Number.isInteger(versionCode) ? { versionCode } : {}),
    mandatory,
    assets,
  };
}

function getArgument(name) {
  return process.argv.find((argument) => argument.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
}

function getArguments(name) {
  return process.argv
    .filter((argument) => argument.startsWith(`--${name}=`))
    .map((argument) => argument.split("=").slice(1).join("="));
}

function getFileAsset(filePath) {
  const contents = fs.readFileSync(filePath);
  return {
    name: path.basename(filePath),
    sizeBytes: contents.byteLength,
    sha256: crypto.createHash("sha256").update(contents).digest("hex"),
  };
}

function main() {
  const versionCodeArgument = getArgument("version-code");
  const versionCode = versionCodeArgument === undefined ? undefined : Number(versionCodeArgument);
  if (versionCode !== undefined && (!Number.isInteger(versionCode) || versionCode < 0)) {
    throw new Error(`Invalid version code: ${versionCodeArgument}`);
  }
  const output = getArgument("output") ?? "release-manifest.json";
  const manifest = createReleaseManifest({
    version: getArgument("version"),
    versionCode,
    channel: getArgument("channel") ?? "stable",
    mandatory: getArgument("mandatory") === "true",
    assets: getArguments("asset").map(getFileAsset),
  });
  fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${output}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
