package com.nuvio.tv.updater

import com.nuvio.tv.BuildConfig
import com.nuvio.tv.data.remote.api.GitHubReleaseApi
import com.nuvio.tv.data.remote.dto.GitHubAssetDto
import com.nuvio.tv.data.remote.dto.GitHubContributorDto
import com.nuvio.tv.data.remote.dto.GitHubReleaseDto
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.Response

class KinoUpdateRepositoryTest {

    private class FakeGitHubReleaseApi(
        private val latest: GitHubReleaseDto,
        private val all: List<GitHubReleaseDto> = listOf(latest)
    ) : GitHubReleaseApi {
        val requestedRepos = mutableListOf<Pair<String, String>>()

        override suspend fun getLatestRelease(owner: String, repo: String): Response<GitHubReleaseDto> {
            requestedRepos += owner to repo
            return Response.success(latest)
        }

        override suspend fun getReleases(
            owner: String,
            repo: String,
            perPage: Int
        ): Response<List<GitHubReleaseDto>> {
            requestedRepos += owner to repo
            return Response.success(all)
        }

        override suspend fun getContributors(
            owner: String,
            repo: String
        ): Response<List<GitHubContributorDto>> = Response.success(emptyList())
    }

    private fun asset(name: String) = GitHubAssetDto(
        name = name,
        browserDownloadUrl = "https://github.com/115jon/Kino-TV/releases/download/android-tv-v0.1.1/$name",
        size = 141_513_523L
    )

    private fun kinoRelease(version: String, prerelease: Boolean = false) = GitHubReleaseDto(
        tagName = "android-tv-v$version",
        name = "Kino TV v$version",
        body = "notes",
        prerelease = prerelease,
        htmlUrl = "https://github.com/115jon/Kino-TV/releases/tag/android-tv-v$version",
        assets = listOf(asset("release-manifest.json"), asset("Kino-TV-$version.apk"))
    )

    @Test
    fun `build points the updater at the kino tv repository`() {
        assertEquals("115jon", BuildConfig.GITHUB_OWNER)
        assertEquals("Kino-TV", BuildConfig.GITHUB_REPO)
    }

    @Test
    fun `stable update comes from kino tv with its apk asset`() = runTest {
        val api = FakeGitHubReleaseApi(kinoRelease("0.1.1"))

        val update = UpdateRepository(api).getLatestUpdate(UpdateChannel.STABLE).getOrThrow()

        assertEquals(listOf("115jon" to "Kino-TV"), api.requestedRepos)
        assertEquals("android-tv-v0.1.1", update.tag)
        assertEquals("Kino-TV-0.1.1.apk", update.assetName)
        assertTrue(update.assetUrl.endsWith("/android-tv-v0.1.1/Kino-TV-0.1.1.apk"))
        assertTrue(VersionUtils.isRemoteNewer(update.tag, "0.1.0"))
    }

    @Test
    fun `beta channel takes the newest kino tv release`() = runTest {
        val api = FakeGitHubReleaseApi(
            latest = kinoRelease("0.1.1"),
            all = listOf(kinoRelease("0.1.1"), kinoRelease("0.2.0-beta.1", prerelease = true), kinoRelease("0.1.0"))
        )

        val update = UpdateRepository(api).getLatestUpdate(UpdateChannel.BETA).getOrThrow()

        assertEquals("android-tv-v0.2.0-beta.1", update.tag)
        assertEquals("Kino-TV-0.2.0-beta.1.apk", update.assetName)
    }

    @Test
    fun `release without an apk is not offered`() = runTest {
        val release = kinoRelease("0.1.1").copy(assets = listOf(asset("release-manifest.json")))

        val result = UpdateRepository(FakeGitHubReleaseApi(release)).getLatestUpdate(UpdateChannel.STABLE)

        assertTrue(result.exceptionOrNull() is NoEligibleUpdateException)
    }

    @Test
    fun `kino tv apk wins over other apks on the release`() {
        val selected = AbiSelector.chooseBestApkAsset(
            assets = listOf(
                asset("app-full-arm64-v8a-release.apk"),
                asset("Kino-TV-0.1.1.apk"),
                asset("release-manifest.json")
            ),
            supportedAbis = listOf("arm64-v8a", "armeabi-v7a")
        )

        assertEquals("Kino-TV-0.1.1.apk", selected?.name)
    }

    @Test
    fun `abi split kino tv apks follow the device abi`() {
        val selected = AbiSelector.chooseBestApkAsset(
            assets = listOf(
                asset("Kino-TV-0.2.0-arm64-v8a.apk"),
                asset("Kino-TV-0.2.0-armeabi-v7a.apk"),
                asset("Kino-TV-0.2.0-universal.apk")
            ),
            supportedAbis = listOf("armeabi-v7a", "armeabi")
        )

        assertEquals("Kino-TV-0.2.0-armeabi-v7a.apk", selected?.name)
    }

    @Test
    fun `non apk assets are ignored`() {
        assertEquals(
            null,
            AbiSelector.chooseBestApkAsset(listOf(asset("release-manifest.json")), supportedAbis = emptyList())
        )
    }

    @Test
    fun `installed release is not offered again`() {
        assertFalse(VersionUtils.isRemoteNewer("android-tv-v0.1.0", "0.1.0"))
        assertFalse(VersionUtils.isRemoteNewer("android-tv-v0.1.0", "0.1.1"))
    }
}
