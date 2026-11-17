package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.ui.theme.BronzeBorder
import com.example.ui.theme.ObsidianBg
import com.example.ui.theme.RoyalGold
import com.example.ui.theme.RoyalGoldBright
import kotlin.math.hypot

@Composable
fun VirtualJoystick(
  onMove: (x: Float, y: Float) -> Unit,
  modifier: Modifier = Modifier,
  size: Dp = 134.dp,
) {
  val maxRadiusPx = with(LocalDensity.current) { (size / 2 - 22.dp).toPx() }
  var knobOffset by remember { mutableStateOf(Offset.Zero) }
  var active by remember { mutableStateOf(false) }

  Box(
    modifier = modifier
      .size(size)
      .testTag("virtual_joystick")
      .semantics { contentDescription = "Movement Virtual Joystick" }
      .pointerInput(maxRadiusPx) {
        detectDragGestures(
          onDragStart = {
            active = true
          },
          onDragEnd = {
            active = false
            knobOffset = Offset.Zero
            onMove(0f, 0f)
          },
          onDragCancel = {
            active = false
            knobOffset = Offset.Zero
            onMove(0f, 0f)
          },
          onDrag = { change, dragAmount ->
            change.consume()
            val candidate = knobOffset + dragAmount
            val dist = hypot(candidate.x, candidate.y)
            val clamped = if (dist > maxRadiusPx && dist > 0.001f) {
              candidate * (maxRadiusPx / dist)
            } else {
              candidate
            }
            knobOffset = clamped
            val nx = (clamped.x / maxRadiusPx).coerceIn(-1f, 1f)
            // Screen Y down is negative forward; invert so dragging up = +Y forward
            val ny = (-clamped.y / maxRadiusPx).coerceIn(-1f, 1f)
            onMove(nx, ny)
          },
        )
      },
  ) {
    Canvas(modifier = Modifier.fillMaxSize()) {
      val center = Offset(this.size.width / 2f, this.size.height / 2f)
      val outerR = this.size.minDimension / 2f - 4f

      // Outer semi-transparent medallion
      drawCircle(
        color = ObsidianBg.copy(alpha = 0.48f),
        radius = outerR,
        center = center,
      )
      drawCircle(
        color = if (active) RoyalGold.copy(alpha = 0.85f) else BronzeBorder.copy(alpha = 0.75f),
        radius = outerR,
        center = center,
        style = Stroke(width = 3f),
      )
      // Walk/Run threshold inner ring
      drawCircle(
        color = RoyalGold.copy(alpha = 0.22f),
        radius = outerR * 0.55f,
        center = center,
        style = Stroke(width = 1.5f),
      )

      // Thumb knob
      val knobCenter = center + knobOffset
      drawCircle(
        brush = Brush.radialGradient(
          colors = listOf(RoyalGoldBright, RoyalGold, Color(0xFF7A5318)),
          center = knobCenter,
          radius = 34f,
        ),
        radius = 28f,
        center = knobCenter,
      )
      drawCircle(
        color = Color.White.copy(alpha = 0.45f),
        radius = 28f,
        center = knobCenter,
        style = Stroke(width = 2f),
      )
    }
  }
}
