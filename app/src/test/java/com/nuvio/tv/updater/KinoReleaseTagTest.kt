package com.nuvio.tv.updater

import com.nuvio.tv.data.remote.dto.GitHubReleaseDto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class KinoReleaseTagTest {
    @Test
    fun `kino tv release tags parse as versions`() {
        assertTrue(VersionUtils.isRemoteNewer("android-tv-v0.2.0", "0.1.0"))
        assertFalse(VersionUtils.isRemoteNewer("android-tv-v0.1.0", "0.1.0"))
        assertFalse(VersionUtils.isPrerelease("android-tv-v0.1.0"))
    }

    @Test
    fun `kino tv tags compare numerically and keep prerelease order`() {
        assertTrue(VersionUtils.isRemoteNewer("android-tv-v0.1.10", "0.1.9"))
        assertTrue(VersionUtils.isRemoteNewer("android-tv-v0.1.1", "0.1.0"))
        assertTrue(VersionUtils.isRemoteNewer("android-tv-v0.2.0", "0.2.0-beta.3"))
        assertFalse(VersionUtils.isRemoteNewer("android-tv-v0.2.0-beta.3", "0.2.0"))
        assertTrue(VersionUtils.isPrerelease("android-tv-v0.2.0-beta.3"))
        assertEquals(SemanticVersion(0, 1, 1, emptyList()), VersionUtils.parse("android-tv-v0.1.1"))
    }

    @Test
    fun `tags without the kino tv shape are not offered`() {
        assertFalse(VersionUtils.isRemoteNewer("android-v0.2.0", "0.1.0"))
        assertFalse(VersionUtils.isRemoteNewer("desktop-v0.2.0", "0.1.0"))
        assertFalse(VersionUtils.isRemoteNewer("android-tv-latest", "0.1.0"))
    }

    @Test
    fun `stable channel skips kino tv prereleases and drafts`() {
        val releases = listOf(
            GitHubReleaseDto(tagName = "android-tv-v0.3.0", name = "Kino TV v0.3.0", draft = true),
            GitHubReleaseDto(tagName = "android-tv-v0.2.0-beta.1", name = "Kino TV v0.2.0-beta.1", prerelease = true),
            GitHubReleaseDto(tagName = "android-tv-v0.1.1", name = "Kino TV v0.1.1")
        )

        val stable = ReleaseSelector.eligibleReleases(releases, UpdateChannel.STABLE)
        val beta = ReleaseSelector.eligibleReleases(releases, UpdateChannel.BETA)

        assertEquals(listOf("android-tv-v0.1.1"), stable.map { it.tagName })
        assertEquals(listOf("android-tv-v0.2.0-beta.1", "android-tv-v0.1.1"), beta.map { it.tagName })
    }

    @Test
    fun `stable channel picks the newest kino tv release`() {
        val releases = listOf(
            GitHubReleaseDto(tagName = "android-tv-v0.1.0", name = "Kino TV v0.1.0"),
            GitHubReleaseDto(tagName = "android-tv-v0.2.0", name = "Kino TV v0.2.0")
        )

        val selected = ReleaseSelector.eligibleReleases(releases, UpdateChannel.STABLE)

        assertEquals(listOf("android-tv-v0.2.0", "android-tv-v0.1.0"), selected.map { it.tagName })
    }
}
