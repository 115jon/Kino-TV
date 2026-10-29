# Kino TV: setup, upstream sync and releases

Kino TV is the Android TV app of Kino, a GPLv3 fork of NuvioMedia/NuvioTV. The phone and desktop app lives in
[115jon/Kino](https://github.com/115jon/Kino); this repository only ships the TV app.

## Setup

Remotes:

- `origin`: upstream `https://github.com/NuvioMedia/NuvioTV.git`, branch `dev`. Fetch only, never push.
- `fork`: `https://github.com/115jon/Kino-TV.git`, default branch `main`. Branches, tags and releases live here.

`main` started from upstream `dev` at the tag `kino-tv/fork-base`.

Application identity, all set in the Kino block of `app/build.gradle.kts` so upstream's version bumps never conflict:

- Application ID `site.x115jon.kino.tv` (debug `site.x115jon.kino.tv.debug`). Upstream is `com.nuvio.tv`
  (`com.nuvio.app` on Play) and Kino's phone app is `site.x115jon.kino`, so all three install side by side.
- `versionName` and `versionCode` come from `release/versions/android-tv.properties`, not upstream's `defaultConfig`.
- The in-app updater reads releases from `115jon/Kino-TV`. `VersionUtils` strips the `android-tv-` tag prefix.
- Kotlin packages (`com.nuvio.tv`), the Gradle namespace, `NUVIO_*` build properties and log tags stay as upstream has
  them. Renaming them only creates sync conflicts.
- App name `Kino`, Kino launcher icon, TV banners and wordmarks.

Backend: the release build reads `NUVIO_SUPABASE_URL`, `NUVIO_SUPABASE_ANON_KEY` and `INTRODB_API_URL` from
`local.properties`, which CI writes from the same `KINO_*` secrets Kino's phone app uses. Accounts, library, watch
progress and profiles are therefore shared with Kino on the phone and desktop. Sign-in on the TV uses the device
login (QR code and `nuvio.tv/link`), which approves against the same backend.

Local build:

```
GRADLE_OPTS=-Dorg.gradle.daemon=false ./gradlew :app:assembleFullRelease
```

`local.properties` needs `sdk.dir`, the backend keys above and, to sign, `NUVIO_RELEASE_STORE_FILE`,
`NUVIO_RELEASE_STORE_PASSWORD`, `NUVIO_RELEASE_KEY_ALIAS` and `NUVIO_RELEASE_KEY_PASSWORD` (Kino's keystore, so both
apps share a signer). Debug builds are signed with the release config too, so set the signing keys for those as
well. `DOVI_NATIVE_ENABLED=true` with `DOVI_LIBDOVI_PREBUILT_ROOT=DV7/libdovi` builds the Dolby Vision bridge, which
needs NDK `29.0.14206865`. Every other native piece (Media3 engine, FFmpeg, libass, mpv, mediainfo) is a prebuilt AAR
in `app/libs`, and `ffmpeg-decoder-downmix` is only built when `USE_LOCAL_FFMPEG_DECODER=true`.

## Product scope

Kino is an app where a user signs in and watches. Kino TV switches off, rather than deletes, upstream's promo
surfaces:

- `AppFeaturePolicy.supportNuvioEnabled` is `false` in both flavors (support, supporter and contributor pages).
- `KinoFeaturePolicy` hides the member badge on the wordmark, the launcher artwork picker, the privacy policy
  link to nuvio.tv and the debug member tier card, and opens supporter themes to everyone.
- The licenses page links its app entry to this repository.

After each sync, check nothing new brings back support, donation, membership, GitHub, Discord or website promo.
Keep `LICENSE`, `FORK_NOTICE.md` and the licenses page. Keep functional backends: Supabase, `nuvio.tv/link`, party
links and `ServerDiscovery`.

## Weekly upstream sync

`.github/workflows/upstream-sync.yml` runs Mondays 03:47 UTC and on demand. It fetches upstream `dev` and exits if
`main` already contains it. Otherwise it creates `sync/upstream-<YYYYMMDD>` and merges:

- Right after the merge it runs `scripts/kino/deleted-paths.mjs apply` from `main`, so anything listed in
  `scripts/kino/deleted-paths.txt` that upstream changed or re-added is removed again.
- Clean: it runs `scripts/kino/rebrand.mjs` (committing new rebranded strings), then `rebrand.mjs --check` and
  `release-version.mjs verify`, pushes the branch and opens a PR to `main`. It closes the conflict issue if open.
- Conflicts: it aborts and creates or updates the issue "Upstream sync needs a manual merge" with the conflicted
  paths.

Pushes made with `GITHUB_TOKEN` do not trigger other workflows, so the sync PR has no checks until you push to it
or run the verify steps below yourself.

Manual merge, with commits through the `commit` CLI only:

1. `git fetch origin` and `git fetch fork`. Stop if `main` is dirty or an earlier sync PR is still open.
2. `git tag kino-tv/pre-sync-<YYYYMMDD> main`, then branch `sync/upstream-<YYYYMMDD>` from `main`.
3. `git config rerere.enabled true`, `git merge --no-ff --no-commit origin/dev`, then
   `node scripts/kino/deleted-paths.mjs apply`.
4. Resolve each conflict by reading both sides. Take upstream for feature code, translations, tests and
   `gradle/libs.versions.toml`, then port the Kino hunk back. Keep ours for the list below.
5. `node scripts/kino/rebrand.mjs`, then `node scripts/kino/rebrand.mjs --check` must report 0.
6. `commit resolve --take <paths>`, `commit continue`, then push the branch and tag to `fork` and open a PR.

Keep ours:

- Launcher icons, banners, `app_logo*.png`, `nuvio_text.png`, `tv_banner.png`, `app_name`.
- The Kino block in `app/build.gradle.kts`, `KinoFeaturePolicy`, the `false` flags in both `AppFeaturePolicy` files,
  and the `android-tv-` prefix in `VersionUtils`.
- Our workflows (`android-release`, `platform-checks`, `release-please`, `upstream-sync`), `.github/release-please/`,
  `.github/PULL_REQUEST_TEMPLATE.md`, `release/versions/`, `scripts/kino/`, `docs/operations/`.
- Paths in `scripts/kino/deleted-paths.txt` stay deleted. Add a path there in the same PR that deletes it.

## Releases

1. Conventional commits land on `main`. `release-please.yml` uses `.github/release-please/android-tv-config.json`
   and its manifest, one component `android-tv`, tags `android-tv-vX.Y.Z`.
2. Release-please opens `release-please--branches--main--components--android-tv`. The workflow then runs
   `scripts/kino/release-version.mjs sync`, which raises `versionCode` in `release/versions/android-tv.properties`
   whenever the version rises.
3. Merging that PR updates `CHANGELOG-android-tv.md`, `release/versions/android-tv.version` and `versionName`, then
   creates the tag and GitHub release.
4. `android-release.yml` verifies the release state, runs the updater tests, builds `:app:assembleFullRelease`,
   checks the universal APK with `apksigner`, and attaches `Kino-TV-X.Y.Z.apk` and `release-manifest.json` to the
   release, named `Kino TV vX.Y.Z`.

Without a `RELEASE_TOKEN` secret, release-please runs on `GITHUB_TOKEN`. Its tag push then cannot start other
workflows, so `release-please.yml` starts `android-release.yml` itself with `gh workflow run`, and release PRs get
no checks. With a `RELEASE_TOKEN` (a fine-grained PAT with contents, pull requests, issues and workflows write on
this repository) the tag push starts the build and the dispatch is skipped.

`android-release.yml` can also be started by hand with an existing `android-tv-v*` tag.

## Secrets

`gh secret list -R 115jon/Kino-TV`:

| Secret | Used for |
| --- | --- |
| `KINO_RELEASE_KEYSTORE_BASE64` | base64 of Kino's release keystore |
| `KINO_RELEASE_STORE_PASSWORD` | keystore password |
| `KINO_RELEASE_KEY_ALIAS` | key alias |
| `KINO_RELEASE_KEY_PASSWORD` | key password |
| `KINO_SUPABASE_URL`, `KINO_SUPABASE_ANON_KEY` | backend, required |
| `KINO_INTRODB_API_URL` | intro skip API, optional |
| `RELEASE_TOKEN` | optional PAT, see above |

## Verify

```
node --test scripts/kino/*.test.mjs
node scripts/kino/rebrand.mjs --check
node scripts/kino/deleted-paths.mjs check
node scripts/kino/release-version.mjs verify
./gradlew :app:testFullDebugUnitTest --tests 'com.nuvio.tv.updater.*' :app:assembleFullDebug
```

## Known traps

- Upstream ignores `scripts/*` and `docs/`; `.gitignore` re-includes `scripts/kino/` and `docs/operations/`.
- `core.autocrlf=true` and a few files are CRLF in the index (`values-bg/strings.xml`, some raw SVGs). Check
  `git diff --stat` for whole-file churn after editing.
- `libmpv-android` was an orphan gitlink; it stays deleted.
