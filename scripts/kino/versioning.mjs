export const TAG_PREFIX = "android-tv-v";
export const VERSION_FILE = "release/versions/android-tv.properties";
export const CANONICAL_FILE = "release/versions/android-tv.version";

const VERSION_PATTERN = /^versionName=(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\r?$/m;
const BUILD_PATTERN = /^versionCode=(\d+)\r?$/m;

export function getTag(version) {
  return `${TAG_PREFIX}${version}`;
}

export function compareVersions(left, right) {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);

  for (let index = 0; index < 3; index += 1) {
    if (leftParts.core[index] !== rightParts.core[index]) {
      return leftParts.core[index] > rightParts.core[index] ? 1 : -1;
    }
  }

  if (!leftParts.preRelease && !rightParts.preRelease) return 0;
  if (!leftParts.preRelease) return 1;
  if (!rightParts.preRelease) return -1;

  const size = Math.max(leftParts.preRelease.length, rightParts.preRelease.length);
  for (let index = 0; index < size; index += 1) {
    const leftPart = leftParts.preRelease[index];
    const rightPart = rightParts.preRelease[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    if (leftPart === rightPart) continue;

    const leftNumber = /^\d+$/.test(leftPart) ? Number(leftPart) : null;
    const rightNumber = /^\d+$/.test(rightPart) ? Number(rightPart) : null;
    if (leftNumber !== null && rightNumber !== null) return leftNumber > rightNumber ? 1 : -1;
    if (leftNumber !== null) return -1;
    if (rightNumber !== null) return 1;
    return leftPart > rightPart ? 1 : -1;
  }

  return 0;
}

export function isReleaseStateAtLeast(current, baseline) {
  return compareVersions(current.version, baseline.version) >= 0 && current.build >= baseline.build;
}

export function synchronizeReleaseState(current, nextVersion, baseline = current) {
  if (compareVersions(nextVersion, current.version) < 0) {
    throw new Error(`Release version ${nextVersion} is lower than ${current.version}`);
  }

  const versionIncreased = compareVersions(nextVersion, baseline.version) > 0;
  return {
    version: nextVersion,
    build: versionIncreased ? Math.max(current.build, baseline.build + 1) : current.build,
  };
}

export function readReleaseState(content, file = VERSION_FILE) {
  const version = content.match(VERSION_PATTERN)?.[1];
  const build = Number(content.match(BUILD_PATTERN)?.[1]);
  if (!version || !Number.isInteger(build)) throw new Error(`Invalid version file: ${file}`);
  return { version, build };
}

export function writeReleaseState(content, state) {
  return content
    .replace(/^(versionName=)\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/m, `$1${state.version}`)
    .replace(/^(versionCode=)\d+/m, `$1${state.build}`);
}

function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) throw new Error(`Invalid semantic version: ${version}`);
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    preRelease: match[4]?.split(".") ?? null,
  };
}
