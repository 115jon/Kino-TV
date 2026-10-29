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
    fun `stable channel picks the newest kino tv release`() {
        val releases = listOf(
            GitHubReleaseDto(tagName = "android-tv-v0.1.0", name = "Kino TV v0.1.0"),
            GitHubReleaseDto(tagName = "android-tv-v0.2.0", name = "Kino TV v0.2.0")
        )

        val selected = ReleaseSelector.eligibleReleases(releases, UpdateChannel.STABLE)

        assertEquals(listOf("android-tv-v0.2.0", "android-tv-v0.1.0"), selected.map { it.tagName })
    }
}
