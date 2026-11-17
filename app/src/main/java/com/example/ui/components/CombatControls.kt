package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.SportsMartialArts
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.AppLanguage
import com.example.ui.theme.BossFlame
import com.example.ui.theme.BronzeSurface
import com.example.ui.theme.CrimsonHealth
import com.example.ui.theme.FrostBlue
import com.example.ui.theme.ParchmentText
import com.example.ui.theme.RoyalGold

@Composable
fun CombatControls(
  language: AppLanguage,
  comboCount: Int,
  onAttack: () -> Unit,
  onHeavyAttack: () -> Unit,
  onBlockChanged: (Boolean) -> Unit,
  onDodge: () -> Unit,
  onJump: () -> Unit,
  modifier: Modifier = Modifier,
) {
  Column(
    modifier = modifier,
    horizontalAlignment = Alignment.End,
    verticalArrangement = Arrangement.spacedBy(10.dp),
  ) {
    Row(
      horizontalArrangement = Arrangement.spacedBy(10.dp),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      ActionCircleButton(
        icon = Icons.Default.ArrowUpward,
        label = if (language == AppLanguage.AR) "قفز" else "Jump",
        accent = Color(0xFF9CCC65),
        size = 54.dp,
        tag = "jump_button",
        onClick = onJump,
      )
      ActionCircleButton(
        icon = Icons.Default.DirectionsRun,
        label = if (language == AppLanguage.AR) "تفادي" else "Dodge",
        accent = RoyalGold,
        size = 58.dp,
        tag = "dodge_button",
        onClick = onDodge,
      )
    }

    Row(
      horizontalArrangement = Arrangement.spacedBy(12.dp),
      verticalAlignment = Alignment.Bottom,
    ) {
      HoldActionCircleButton(
        icon = Icons.Default.Shield,
        label = if (language == AppLanguage.AR) "دفاع" else "Block",
        accent = FrostBlue,
        size = 62.dp,
        tag = "block_button",
        onHoldChanged = onBlockChanged,
      )

      ActionCircleButton(
        icon = Icons.Default.Bolt,
        label = if (language == AppLanguage.AR) "ضربة قوية" else "Heavy",
        accent = BossFlame,
        size = 64.dp,
        tag = "heavy_attack_button",
        onClick = onHeavyAttack,
      )

      ActionCircleButton(
        icon = Icons.Default.SportsMartialArts,
        label = if (comboCount > 0) "x$comboCount" else if (language == AppLanguage.AR) "هجوم" else "Attack",
        accent = CrimsonHealth,
        size = 78.dp,
        tag = "attack_button",
        onClick = onAttack,
      )
    }
  }
}

@Composable
private fun ActionCircleButton(
  icon: ImageVector,
  label: String,
  accent: Color,
  size: Dp,
  tag: String,
  onClick: () -> Unit,
) {
  Surface(
    onClick = onClick,
    shape = CircleShape,
    color = BronzeSurface.copy(alpha = 0.86f),
    border = BorderStroke(2.dp, accent),
    shadowElevation = 6.dp,
    modifier = Modifier
      .size(size)
      .testTag(tag)
      .semantics { contentDescription = label },
  ) {
    Column(
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.Center,
      modifier = Modifier.padding(4.dp),
    ) {
      Icon(
        imageVector = icon,
        contentDescription = null,
        tint = accent,
        modifier = Modifier.size(size * 0.42f),
      )
      Text(
        text = label,
        color = ParchmentText,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        maxLines = 1,
      )
    }
  }
}

@Composable
private fun HoldActionCircleButton(
  icon: ImageVector,
  label: String,
  accent: Color,
  size: Dp,
  tag: String,
  onHoldChanged: (Boolean) -> Unit,
) {
  var pressed by remember { mutableStateOf(false) }

  Surface(
    shape = CircleShape,
    color = if (pressed) accent.copy(alpha = 0.35f) else BronzeSurface.copy(alpha = 0.86f),
    border = BorderStroke(2.dp, accent),
    shadowElevation = 6.dp,
    modifier = Modifier
      .size(size)
      .testTag(tag)
      .semantics { contentDescription = label }
      .pointerInput(Unit) {
        detectTapGestures(
          onPress = {
            pressed = true
            onHoldChanged(true)
            tryAwaitRelease()
            pressed = false
            onHoldChanged(false)
          },
        )
      },
  ) {
    Box(contentAlignment = Alignment.Center) {
      Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
      ) {
        Icon(
          imageVector = icon,
          contentDescription = null,
          tint = accent,
          modifier = Modifier.size(size * 0.42f),
        )
        Text(
          text = label,
          color = ParchmentText,
          fontSize = 10.sp,
          fontWeight = FontWeight.Bold,
          maxLines = 1,
        )
      }
    }
  }
}
