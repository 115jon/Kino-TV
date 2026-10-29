package com.nuvio.tv.domain.model

import com.nuvio.tv.core.build.KinoFeaturePolicy

object KinoMemberAccess {
    private val themeEntitlements = setOf(
        CosmeticEntitlement.GOLD_THEME,
        CosmeticEntitlement.JADE_THEME,
        CosmeticEntitlement.ROSE_GOLD_THEME,
        CosmeticEntitlement.ARCTIC_BLUE_THEME,
        CosmeticEntitlement.GRAPHITE_THEME
    )

    fun themes(entitlements: CosmeticEntitlements): CosmeticEntitlements =
        if (KinoFeaturePolicy.supporterThemesOpen) {
            entitlements.copy(unlocked = entitlements.unlocked + themeEntitlements)
        } else {
            entitlements
        }

    fun resolveTheme(selectedTheme: AppTheme?, entitlements: CosmeticEntitlements): AppTheme =
        resolveAppTheme(selectedTheme, if (selectedTheme == null) entitlements else themes(entitlements))

    fun customColors(colors: CustomThemeColors, memberTier: MemberTier?): CustomThemeColors =
        if (KinoFeaturePolicy.supporterThemesOpen) colors else resolveCustomThemeColors(colors, memberTier)

    fun gradientEnabled(memberTier: MemberTier?): Boolean =
        KinoFeaturePolicy.supporterThemesOpen || memberTier != null
}
