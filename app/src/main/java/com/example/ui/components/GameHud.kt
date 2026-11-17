package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CenterFocusStrong
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.ZoomIn
import androidx.compose.material.icons.filled.ZoomOut
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.AppLanguage
import com.example.data.GameCatalog
import com.example.data.GameUiState
import com.example.ui.theme.BossFlame
import com.example.ui.theme.BronzeBorder
import com.example.ui.theme.BronzeCard
import com.example.ui.theme.BronzeSurface
import com.example.ui.theme.CrimsonHealth
import com.example.ui.theme.EmeraldStamina
import com.example.ui.theme.FrostBlue
import com.example.ui.theme.MutedStoneText
import com.example.ui.theme.ObsidianBg
import com.example.ui.theme.ParchmentText
import com.example.ui.theme.RoyalGold
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun GameHud(
  state: GameUiState,
  onJoystickMove: (Float, Float) -> Unit,
  onAttack: () -> Unit,
  onHeavyAttack: () -> Unit,
  onBlockChanged: (Boolean) -> Unit,
  onDodge: () -> Unit,
  onJump: () -> Unit,
  onSelectWeapon: (String) -> Unit,
  onToggleLockOn: () -> Unit,
  onZoom: (Float) -> Unit,
  onToggleLanguage: () -> Unit,
  onPause: () -> Unit,
  onOpenZoneMap: () -> Unit,
  modifier: Modifier = Modifier,
) {
  val lang = state.language
  val isAr = lang == AppLanguage.AR

  Box(
    modifier = modifier
      .fillMaxSize()
      .windowInsetsPadding(WindowInsets.safeDrawing)
      .padding(horizontal = 12.dp, vertical = 8.dp),
  ) {
    // Top HUD row
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .align(Alignment.TopCenter),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.Top,
    ) {
      // Top-Left: Player HP, Stamina, Mission & Zone badge
      Column(
        verticalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier.width(230.dp),
      ) {
        Surface(
          shape = RoundedCornerShape(12.dp),
          color = BronzeSurface.copy(alpha = 0.86f),
          border = BorderStroke(1.dp, BronzeBorder),
        ) {
          Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically,
            ) {
              Text(
                text = if (state.isFreeRoam) {
                  if (isAr) "استكشاف حر" else "Free Roam"
                } else {
                  if (isAr) "المرحلة ${state.activeMissionId}/7" else "Stage ${state.activeMissionId}/7"
                },
                color = RoyalGold,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
              )
              Text(
                text = "${state.fps} FPS",
                color = MutedStoneText,
                fontSize = 11.sp,
              )
            }

            // Health bar
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
              Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(if (isAr) "الصحة" else "HP", color = ParchmentText, fontSize = 11.sp)
                Text("${state.hp}/${state.maxHp}", color = ParchmentText, fontSize = 11.sp)
              }
              LinearProgressIndicator(
                progress = { (state.hp.toFloat() / state.maxHp.coerceAtLeast(1)).coerceIn(0f, 1f) },
                modifier = Modifier
                  .fillMaxWidth()
                  .height(8.dp)
                  .clip(RoundedCornerShape(4.dp)),
                color = CrimsonHealth,
                trackColor = ObsidianBg,
              )
            }

            // Stamina bar
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
              Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(if (isAr) "التحمل" else "Stamina", color = MutedStoneText, fontSize = 11.sp)
                Text("${state.stamina}/${state.maxStamina}", color = MutedStoneText, fontSize = 11.sp)
              }
              LinearProgressIndicator(
                progress = { (state.stamina.toFloat() / state.maxStamina.coerceAtLeast(1)).coerceIn(0f, 1f) },
                modifier = Modifier
                  .fillMaxWidth()
                  .height(6.dp)
                  .clip(RoundedCornerShape(3.dp)),
                color = EmeraldStamina,
                trackColor = ObsidianBg,
              )
            }
          }
        }

        // Zone & Enemies pill
        Surface(
          shape = RoundedCornerShape(10.dp),
          color = BronzeSurface.copy(alpha = 0.84f),
          border = BorderStroke(1.dp, BronzeBorder),
        ) {
          Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            Icon(Icons.Default.Explore, contentDescription = null, tint = RoyalGold, modifier = Modifier.size(16.dp))
            Text(
              text = state.zoneName.get(lang),
              color = ParchmentText,
              fontSize = 12.sp,
              maxLines = 1,
              overflow = TextOverflow.Ellipsis,
              modifier = Modifier.weight(1f, fill = false),
            )
            Text(
              text = if (isAr) "أعداء: ${state.enemiesAlive}" else "Foes: ${state.enemiesAlive}",
              color = if (state.enemiesAlive > 0) BossFlame else EmeraldStamina,
              fontSize = 12.sp,
              fontWeight = FontWeight.Bold,
            )
          }
        }

        if (state.gateLocked) {
          Surface(
            shape = RoundedCornerShape(8.dp),
            color = CrimsonHealth.copy(alpha = 0.85f),
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
              Icon(Icons.Default.Lock, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
              Text(
                text = if (isAr) "بوابة القلعة مغلقة - اهزم الحراس" else "Castle Gate Locked - Defeat Guards",
                color = Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
              )
            }
          }
        }
      }

      // Top-Center: Boss Health Bar + Event Banner
      Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier.weight(1f).padding(horizontal = 12.dp),
      ) {
        AnimatedVisibility(visible = state.boss != null) {
          state.boss?.let { boss ->
            Surface(
              shape = RoundedCornerShape(12.dp),
              color = ObsidianBg.copy(alpha = 0.90f),
              border = BorderStroke(1.5.dp, if (boss.phase == 2) BossFlame else RoyalGold),
              modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
            ) {
              Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.SpaceBetween,
                  verticalAlignment = Alignment.CenterVertically,
                ) {
                  Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                  ) {
                    Icon(
                      Icons.Default.Warning,
                      contentDescription = null,
                      tint = if (boss.phase == 2) BossFlame else RoyalGold,
                      modifier = Modifier.size(16.dp),
                    )
                    Text(
                      text = boss.name.get(lang),
                      color = ParchmentText,
                      fontWeight = FontWeight.Bold,
                      fontSize = 13.sp,
                    )
                  }
                  Text(
                    text = if (boss.phase == 2) {
                      if (isAr) "المرحلة ٢: غضب!" else "PHASE II: ENRAGED"
                    } else {
                      "${boss.hp}/${boss.maxHp}"
                    },
                    color = if (boss.phase == 2) BossFlame else RoyalGold,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                  )
                }
                Spacer(Modifier.height(4.dp))
                LinearProgressIndicator(
                  progress = { (boss.hp.toFloat() / boss.maxHp.coerceAtLeast(1)).coerceIn(0f, 1f) },
                  modifier = Modifier
                    .fillMaxWidth()
                    .height(9.dp)
                    .clip(RoundedCornerShape(5.dp)),
                  color = if (boss.phase == 2) BossFlame else CrimsonHealth,
                  trackColor = BronzeCard,
                )
              }
            }
          }
        }

        AnimatedVisibility(visible = state.bannerEvent != null) {
          state.bannerEvent?.let { msg ->
            Surface(
              shape = RoundedCornerShape(20.dp),
              color = RoyalGold,
              shadowElevation = 8.dp,
            ) {
              Text(
                text = msg.get(lang),
                color = ObsidianBg,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
              )
            }
          }
        }
      }

      // Top-Right: Minimap + Pause / Language / Lock-On / Zoom controls
      Column(
        horizontalAlignment = Alignment.End,
        verticalArrangement = Arrangement.spacedBy(6.dp),
      ) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
          SmallHudIconButton(
            icon = Icons.Default.CenterFocusStrong,
            tint = if (state.lockOn) FrostBlue else ParchmentText,
            description = "Lock On Target",
            tag = "lock_on_button",
            onClick = onToggleLockOn,
          )
          SmallHudIconButton(
            icon = Icons.Default.Translate,
            tint = RoyalGold,
            description = "Switch Language",
            tag = "language_button",
            onClick = onToggleLanguage,
          )
          SmallHudIconButton(
            icon = Icons.Default.Pause,
            tint = ParchmentText,
            description = "Pause Game",
            tag = "pause_button",
            onClick = onPause,
          )
        }

        // Interactive Minimap (tap to open Zone Fast-Travel)
        MinimapWidget(
          state = state,
          onClick = onOpenZoneMap,
        )
      }
    }

    // Bottom Controls: ALWAYS LTR so left-hand joystick stays left and right-hand attacks stay right
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
      Box(
        modifier = Modifier
          .fillMaxWidth()
          .align(Alignment.BottomCenter),
      ) {
        // Left side: Weapon switcher + Zoom + Virtual Joystick
        Column(
          modifier = Modifier.align(Alignment.BottomStart),
          verticalArrangement = Arrangement.spacedBy(8.dp),
          horizontalAlignment = Alignment.Start,
        ) {
          // Weapon switcher row
          Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            GameCatalog.weapons.forEach { weapon ->
              val selected = state.weaponId == weapon.id
              Surface(
                onClick = { onSelectWeapon(weapon.id) },
                shape = RoundedCornerShape(8.dp),
                color = if (selected) RoyalGold else BronzeSurface.copy(alpha = 0.82f),
                border = BorderStroke(1.dp, if (selected) RoyalGold else BronzeBorder),
                modifier = Modifier.testTag("weapon_${weapon.id}"),
              ) {
                Text(
                  text = weapon.name.get(lang),
                  color = if (selected) ObsidianBg else ParchmentText,
                  fontSize = 10.sp,
                  fontWeight = FontWeight.Bold,
                  modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                )
              }
            }
          }

          Row(
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
          ) {
            VirtualJoystick(onMove = onJoystickMove)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
              SmallHudIconButton(
                icon = Icons.Default.ZoomIn,
                tint = ParchmentText,
                description = "Zoom In",
                tag = "zoom_in_button",
                onClick = { onZoom(-1.2f) },
              )
              SmallHudIconButton(
                icon = Icons.Default.ZoomOut,
                tint = ParchmentText,
                description = "Zoom Out",
                tag = "zoom_out_button",
                onClick = { onZoom(1.2f) },
              )
            }
          }
        }

        // Right side: Combat action cluster
        CombatControls(
          language = lang,
          comboCount = state.combo,
          onAttack = onAttack,
          onHeavyAttack = onHeavyAttack,
          onBlockChanged = onBlockChanged,
          onDodge = onDodge,
          onJump = onJump,
          modifier = Modifier.align(Alignment.BottomEnd),
        )
      }
    }
  }
}

@Composable
private fun SmallHudIconButton(
  icon: androidx.compose.ui.graphics.vector.ImageVector,
  tint: Color,
  description: String,
  tag: String,
  onClick: () -> Unit,
) {
  Surface(
    shape = CircleShape,
    color = BronzeSurface.copy(alpha = 0.84f),
    border = BorderStroke(1.dp, BronzeBorder),
    modifier = Modifier.size(48.dp).testTag(tag),
  ) {
    IconButton(onClick = onClick) {
      Icon(imageVector = icon, contentDescription = description, tint = tint)
    }
  }
}

@Composable
private fun MinimapWidget(
  state: GameUiState,
  onClick: () -> Unit,
) {
  val isArena = state.worldId == "tournament-arena"
  val worldRange = if (isArena) 24f else 46f

  Surface(
    shape = RoundedCornerShape(12.dp),
    color = ObsidianBg.copy(alpha = 0.82f),
    border = BorderStroke(1.5.dp, RoyalGold.copy(alpha = 0.7f)),
    modifier = Modifier
      .size(96.dp)
      .testTag("minimap_widget")
      .clickable(onClick = onClick),
  ) {
    Box(modifier = Modifier.fillMaxSize()) {
      Canvas(modifier = Modifier.fillMaxSize().padding(6.dp)) {
        val w = size.width
        val h = size.height
        val toMap = { wx: Float, wz: Float ->
          Offset(
            x = ((wx + worldRange) / (worldRange * 2f)).coerceIn(0f, 1f) * w,
            y = ((wz + worldRange) / (worldRange * 2f)).coerceIn(0f, 1f) * h,
          )
        }

        if (!isArena) {
          // River band
          val rStart = toMap(-28f, 33f)
          val rEnd = toMap(24f, 39f)
          drawRect(
            color = Color(0xFF1E88E5).copy(alpha = 0.45f),
            topLeft = rStart,
            size = Size(rEnd.x - rStart.x, (rEnd.y - rStart.y).coerceAtLeast(4f)),
          )
          // Town walls square [-20..20]
          val wTopLeft = toMap(-20f, -20f)
          val wBotRight = toMap(20f, 20f)
          drawRect(
            color = RoyalGold.copy(alpha = 0.45f),
            topLeft = wTopLeft,
            size = Size(wBotRight.x - wTopLeft.x, wBotRight.y - wTopLeft.y),
            style = Stroke(width = 2f),
          )
        } else {
          val aTopLeft = toMap(-15f, -11f)
          val aBotRight = toMap(15f, 11f)
          drawRect(
            color = RoyalGold.copy(alpha = 0.5f),
            topLeft = aTopLeft,
            size = Size(aBotRight.x - aTopLeft.x, aBotRight.y - aTopLeft.y),
            style = Stroke(width = 2f),
          )
        }

        // Monster dots
        state.radarMonsters.forEach { m ->
          val pt = toMap(m.x, m.z)
          drawCircle(
            color = if (m.isBoss) BossFlame else CrimsonHealth,
            radius = if (m.isBoss) 5.5f else 3.2f,
            center = pt,
          )
        }

        // Player dot + facing indicator
        val pPt = toMap(state.playerX, state.playerZ)
        drawCircle(color = FrostBlue, radius = 4.5f, center = pPt)
        val dirEnd = Offset(
          x = pPt.x + sin(state.playerYaw) * 9f,
          y = pPt.y + cos(state.playerYaw) * 9f,
        )
        drawLine(color = Color.White, start = pPt, end = dirEnd, strokeWidth = 2f)
      }

      Text(
        text = if (state.language == AppLanguage.AR) "الخريطة" else "MAP",
        color = RoyalGold,
        fontSize = 9.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
          .align(Alignment.BottomCenter)
          .background(ObsidianBg.copy(alpha = 0.7f))
          .padding(horizontal = 4.dp),
      )
    }
  }
}
