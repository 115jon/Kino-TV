package com.nuvio.tv.domain.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class KinoMemberAccessTest {
    @Test
    fun supporterThemesAreOpenToEveryone() {
        val themes = availableAppThemes(KinoMemberAccess.themes(CosmeticEntitlements.None))

        listOf(AppTheme.GOLD, AppTheme.JADE, AppTheme.ROSE_GOLD, AppTheme.ARCTIC_BLUE, AppTheme.GRAPHITE)
            .forEach { assertTrue(it in themes) }
        assertEquals(AppTheme.GOLD, KinoMemberAccess.resolveTheme(AppTheme.GOLD, CosmeticEntitlements.None))
    }

    @Test
    fun usersWithoutAThemeChoiceKeepTheStandardDefault() {
        assertEquals(AppTheme.WHITE, KinoMemberAccess.resolveTheme(null, CosmeticEntitlements.None))
    }

    @Test
    fun gradientCustomThemesAreOpenToEveryone() {
        val gradient = CustomThemeColors(0xFF0000, 0x00FF00, 0x0000FF)

        assertEquals(gradient, KinoMemberAccess.customColors(gradient, null))
        assertTrue(KinoMemberAccess.gradientEnabled(null))
    }
}
