<div align="center">

  <img src="assets/brand/app_logo_wordmark.png" alt="Kino" width="300" />

  <p>
    Kino for Android TV. Sign in with your Kino account and pick up your library and watch progress on the big screen.
  </p>

  [Kino TV releases](https://github.com/115jon/Kino-TV/releases?q=android-tv-v) · [Kino for phone and desktop](https://github.com/115jon/Kino)

</div>

## Kino TV

Kino TV is the Android TV app of [Kino](https://github.com/115jon/Kino), an independent fork of
[Nuvio TV](https://github.com/NuvioMedia/NuvioTV). It uses the same account backend as Kino on Android and Windows,
so your profiles, library, watch progress and addons follow you to the TV.

Download `Kino-TV-X.Y.Z.apk` from the [latest release](https://github.com/115jon/Kino-TV/releases/latest) and sideload
it on Android TV or Google TV. The app updates itself from this repository's releases. Its application ID is
`site.x115jon.kino.tv`, so it installs next to Nuvio TV and Kino for phones.

## Build from source

```bash
git clone https://github.com/115jon/Kino-TV.git
cd Kino-TV
./gradlew :app:assembleFullRelease
```

Kino TV is built with Kotlin, Jetpack Compose, TV Material 3 and Media3. Setup, the weekly upstream sync and the
release process are in [docs/operations/kino-tv.md](docs/operations/kino-tv.md).

## License

[GNU General Public License v3.0](./LICENSE). See [FORK_NOTICE.md](./FORK_NOTICE.md).
