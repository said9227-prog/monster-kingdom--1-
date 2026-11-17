package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val KingdomColorScheme = darkColorScheme(
  primary = RoyalGold,
  onPrimary = ObsidianBg,
  primaryContainer = BronzeCard,
  onPrimaryContainer = RoyalGoldBright,
  secondary = CrimsonHealth,
  onSecondary = ParchmentText,
  tertiary = FrostBlue,
  onTertiary = ObsidianBg,
  background = ObsidianBg,
  onBackground = ParchmentText,
  surface = BronzeSurface,
  onSurface = ParchmentText,
  surfaceVariant = BronzeCard,
  onSurfaceVariant = MutedStoneText,
  outline = BronzeBorder,
)

@Composable
fun MonsterKingdomTheme(content: @Composable () -> Unit) {
  MaterialTheme(
    colorScheme = KingdomColorScheme,
    typography = AppTypography,
    content = content,
  )
}
