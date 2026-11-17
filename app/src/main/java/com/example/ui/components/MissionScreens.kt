package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.SportsKabaddi
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.R
import com.example.data.AppLanguage
import com.example.data.GameCatalog
import com.example.data.GameUiState
import com.example.data.GraphicsQuality
import com.example.ui.theme.BronzeBorder
import com.example.ui.theme.BronzeCard
import com.example.ui.theme.BronzeSurface
import com.example.ui.theme.CrimsonHealth
import com.example.ui.theme.EmeraldStamina
import com.example.ui.theme.MutedStoneText
import com.example.ui.theme.ObsidianBg
import com.example.ui.theme.ParchmentText
import com.example.ui.theme.RoyalGold

@Composable
fun CampaignHubScreen(
  state: GameUiState,
  onStartMission: (Int) -> Unit,
  onStartFreeRoam: (String) -> Unit,
  onPreviewWorld: (String) -> Unit,
  onToggleLanguage: () -> Unit,
  onSetQuality: (GraphicsQuality) -> Unit,
) {
  val lang = state.language
  val isAr = lang == AppLanguage.AR
  var showMissionsDrawer by remember { mutableStateOf(false) }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .windowInsetsPadding(WindowInsets.safeDrawing)
      .padding(12.dp),
  ) {
    // Top Floating Header & Live 3D World Switcher (leaves center 3D viewport unobstructed!)
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .widthIn(max = 820.dp)
        .align(Alignment.TopCenter),
      verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      Surface(
        shape = RoundedCornerShape(16.dp),
        color = ObsidianBg.copy(alpha = 0.72f),
        border = BorderStroke(1.dp, RoyalGold.copy(alpha = 0.55f)),
      ) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 8.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
          ) {
            Image(
              painter = painterResource(id = R.drawable.monster_kingdom_icon_1794917269233),
              contentDescription = "Monster Kingdom Crest",
              modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(10.dp)),
            )
            Column {
              Text(
                text = if (isAr) "مملكة الوحوش 3D" else "MONSTER KINGDOM 3D",
                style = MaterialTheme.typography.titleMedium,
                color = RoyalGold,
                fontWeight = FontWeight.Bold,
              )
              Text(
                text = if (state.engineReady) {
                  if (isAr) "العالم ثلاثي الأبعاد جاهز أمامك • اختر عالماً أو ابدأ القتال" else "Live 3D World Ready • Inspect Worlds or Start Battle"
                } else {
                  if (isAr) "جاري تحميل نماذج العالم والوحوش..." else "Loading 3D GLB Worlds & Monsters..."
                },
                style = MaterialTheme.typography.labelMedium,
                color = ParchmentText.copy(alpha = 0.85f),
              )
            }
          }

          Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(
              shape = RoundedCornerShape(8.dp),
              color = BronzeCard.copy(alpha = 0.9f),
              border = BorderStroke(1.dp, RoyalGold.copy(alpha = 0.5f)),
            ) {
              Text(
                text = if (isAr) "${state.gold} ذهب" else "${state.gold} Gold",
                color = RoyalGold,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
              )
            }
            OutlinedButton(
              onClick = onToggleLanguage,
              border = BorderStroke(1.dp, BronzeBorder),
              contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
              modifier = Modifier.testTag("hub_language_button"),
            ) {
              Icon(Icons.Default.Translate, contentDescription = null, tint = RoyalGold, modifier = Modifier.size(16.dp))
              Spacer(Modifier.width(4.dp))
              Text(if (isAr) "EN" else "عربي", color = ParchmentText, fontSize = 12.sp)
            }
          }
        }
      }

      // Live World Preview Selector Row (Switch between Kingdom GLB and Tournament Arena GLB!)
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
      ) {
        val isKingdom = state.worldId != "tournament-arena"
        Surface(
          onClick = { onPreviewWorld("medieval-kingdom") },
          shape = RoundedCornerShape(10.dp),
          color = if (isKingdom) RoyalGold else ObsidianBg.copy(alpha = 0.72f),
          border = BorderStroke(1.dp, if (isKingdom) RoyalGold else BronzeBorder),
          modifier = Modifier.testTag("preview_kingdom_button"),
        ) {
          Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
          ) {
            Icon(
              Icons.Default.Public,
              contentDescription = null,
              tint = if (isKingdom) ObsidianBg else RoyalGold,
              modifier = Modifier.size(16.dp),
            )
            Text(
              text = if (isAr) "عالم المملكة (القلعة والمدينة والغابة)" else "Medieval Kingdom World",
              color = if (isKingdom) ObsidianBg else ParchmentText,
              fontSize = 12.sp,
              fontWeight = FontWeight.Bold,
            )
          }
        }

        Surface(
          onClick = { onPreviewWorld("tournament-arena") },
          shape = RoundedCornerShape(10.dp),
          color = if (!isKingdom) RoyalGold else ObsidianBg.copy(alpha = 0.72f),
          border = BorderStroke(1.dp, if (!isKingdom) RoyalGold else BronzeBorder),
          modifier = Modifier.testTag("preview_arena_button"),
        ) {
          Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
          ) {
            Icon(
              Icons.Default.SportsKabaddi,
              contentDescription = null,
              tint = if (!isKingdom) ObsidianBg else CrimsonHealth,
              modifier = Modifier.size(16.dp),
            )
            Text(
              text = if (isAr) "ساحة المبارزة الملكية" else "Tournament Arena World",
              color = if (!isKingdom) ObsidianBg else ParchmentText,
              fontSize = 12.sp,
              fontWeight = FontWeight.Bold,
            )
          }
        }

        Spacer(Modifier.weight(1f))

        // Quality selector compact pills
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
          GraphicsQuality.entries.forEach { q ->
            val selected = state.quality == q
            Surface(
              onClick = { onSetQuality(q) },
              shape = RoundedCornerShape(6.dp),
              color = if (selected) RoyalGold else ObsidianBg.copy(alpha = 0.72f),
              border = BorderStroke(1.dp, BronzeBorder),
              modifier = Modifier.testTag("quality_${q.name}"),
            ) {
              Text(
                text = q.name,
                color = if (selected) ObsidianBg else ParchmentText,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 7.dp, vertical = 5.dp),
              )
            }
          }
        }
      }

      state.engineError?.let { err ->
        Surface(color = CrimsonHealth.copy(alpha = 0.85f), shape = RoundedCornerShape(8.dp)) {
          Text(text = err, color = Color.White, modifier = Modifier.padding(8.dp), fontSize = 12.sp)
        }
      }
    }

    // Bottom Translucent Action Dock & Expandable 7-Mission List
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .widthIn(max = 820.dp)
        .align(Alignment.BottomCenter),
      verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      AnimatedVisibility(visible = showMissionsDrawer) {
        Surface(
          shape = RoundedCornerShape(16.dp),
          color = ObsidianBg.copy(alpha = 0.88f),
          border = BorderStroke(1.dp, RoyalGold.copy(alpha = 0.5f)),
          modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = 260.dp),
        ) {
          LazyColumn(
            modifier = Modifier.padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            items(GameCatalog.missions, key = { it.id }) { mission ->
              val unlocked = mission.id <= state.unlockedMission || state.completedMissions.contains(mission.id)
              val completed = state.completedMissions.contains(mission.id)
              Card(
                colors = CardDefaults.cardColors(
                  containerColor = if (unlocked) BronzeCard.copy(alpha = 0.92f) else BronzeSurface.copy(alpha = 0.7f),
                ),
                border = BorderStroke(1.dp, if (completed) EmeraldStamina else BronzeBorder),
                modifier = Modifier
                  .fillMaxWidth()
                  .testTag("mission_card_${mission.id}"),
              ) {
                Row(
                  modifier = Modifier.padding(10.dp),
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                  Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Row(
                      verticalAlignment = Alignment.CenterVertically,
                      horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                      Text(
                        text = mission.title.get(lang),
                        color = if (unlocked) RoyalGold else MutedStoneText,
                        style = MaterialTheme.typography.titleMedium,
                        fontSize = 14.sp,
                      )
                      if (completed) {
                        Icon(Icons.Default.CheckCircle, contentDescription = "Completed", tint = EmeraldStamina, modifier = Modifier.size(16.dp))
                      }
                    }
                    Text(
                      text = mission.objective.get(lang),
                      color = ParchmentText.copy(alpha = 0.9f),
                      fontSize = 12.sp,
                    )
                    Text(
                      text = "${mission.enemiesSummary.get(lang)} • +${mission.rewardGold} ${if (isAr) "ذهب" else "Gold"}",
                      color = MutedStoneText,
                      fontSize = 11.sp,
                    )
                  }

                  Spacer(Modifier.width(8.dp))

                  Button(
                    onClick = { onStartMission(mission.id) },
                    enabled = state.engineReady,
                    colors = ButtonDefaults.buttonColors(
                      containerColor = if (unlocked) RoyalGold else BronzeBorder,
                      contentColor = if (unlocked) ObsidianBg else ParchmentText,
                    ),
                    modifier = Modifier.testTag("start_mission_${mission.id}"),
                  ) {
                    Icon(
                      imageVector = if (unlocked) Icons.Default.PlayArrow else Icons.Default.Lock,
                      contentDescription = null,
                      modifier = Modifier.size(16.dp),
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(if (isAr) "العب" else "Play", fontWeight = FontWeight.Bold)
                  }
                }
              }
            }
          }
        }
      }

      // Primary Bottom Action Bar
      Surface(
        shape = RoundedCornerShape(16.dp),
        color = ObsidianBg.copy(alpha = 0.78f),
        border = BorderStroke(1.dp, BronzeBorder),
      ) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(10.dp),
          horizontalArrangement = Arrangement.spacedBy(8.dp),
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Button(
            onClick = { onStartMission(state.unlockedMission) },
            enabled = state.engineReady,
            colors = ButtonDefaults.buttonColors(containerColor = RoyalGold, contentColor = ObsidianBg),
            modifier = Modifier
              .weight(1.3f)
              .height(48.dp)
              .testTag("continue_campaign_button"),
          ) {
            Icon(Icons.Default.PlayArrow, contentDescription = null)
            Spacer(Modifier.width(4.dp))
            Text(
              text = if (!state.engineReady) {
                if (isAr) "جاري التحميل..." else "Loading..."
              } else if (isAr) {
                "العب المهمة ${state.unlockedMission}"
              } else {
                "Play Mission ${state.unlockedMission}"
              },
              fontWeight = FontWeight.Bold,
            )
          }

          OutlinedButton(
            onClick = { onStartFreeRoam(state.worldId) },
            enabled = state.engineReady,
            border = BorderStroke(1.dp, RoyalGold),
            modifier = Modifier
              .weight(1f)
              .height(48.dp)
              .testTag("free_roam_button"),
          ) {
            Icon(Icons.Default.Explore, contentDescription = null, tint = RoyalGold)
            Spacer(Modifier.width(4.dp))
            Text(
              text = if (isAr) "العب بهذا العالم" else "Play This World",
              color = ParchmentText,
              fontSize = 12.sp,
            )
          }

          OutlinedButton(
            onClick = { onStartFreeRoam("tournament-arena") },
            enabled = state.engineReady,
            border = BorderStroke(1.dp, CrimsonHealth),
            modifier = Modifier
              .weight(0.95f)
              .height(48.dp)
              .testTag("tournament_arena_button"),
          ) {
            Icon(Icons.Default.SportsKabaddi, contentDescription = null, tint = CrimsonHealth)
            Spacer(Modifier.width(4.dp))
            Text(if (isAr) "ساحة المبارزة" else "Arena Duel", color = ParchmentText, fontSize = 12.sp)
          }

          OutlinedButton(
            onClick = { showMissionsDrawer = !showMissionsDrawer },
            border = BorderStroke(1.dp, BronzeBorder),
            modifier = Modifier
              .height(48.dp)
              .testTag("toggle_missions_drawer"),
          ) {
            Icon(
              imageVector = if (showMissionsDrawer) Icons.Default.ExpandMore else Icons.Default.ExpandLess,
              contentDescription = null,
              tint = RoyalGold,
            )
            Spacer(Modifier.width(4.dp))
            Text(if (isAr) "المهام (٧)" else "Missions", color = ParchmentText, fontSize = 12.sp)
          }
        }
      }
    }
  }
}

@Composable
fun PauseOverlayDialog(
  state: GameUiState,
  onResume: () -> Unit,
  onRestart: () -> Unit,
  onReturnToHub: () -> Unit,
  onTeleportZone: (String) -> Unit,
  onSetQuality: (GraphicsQuality) -> Unit,
  onToggleLanguage: () -> Unit,
) {
  val lang = state.language
  val isAr = lang == AppLanguage.AR

  Dialog(onDismissRequest = onResume) {
    Surface(
      shape = RoundedCornerShape(18.dp),
      color = BronzeSurface,
      border = BorderStroke(1.5.dp, RoyalGold),
      modifier = Modifier.widthIn(max = 460.dp),
    ) {
      Column(
        modifier = Modifier.padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
      ) {
        Text(
          text = if (isAr) "إيقاف مؤقت" else "GAME PAUSED",
          style = MaterialTheme.typography.headlineMedium,
          color = RoyalGold,
        )

        Button(
          onClick = onResume,
          colors = ButtonDefaults.buttonColors(containerColor = RoyalGold, contentColor = ObsidianBg),
          modifier = Modifier.fillMaxWidth().height(48.dp).testTag("resume_button"),
        ) {
          Icon(Icons.Default.PlayArrow, contentDescription = null)
          Spacer(Modifier.width(6.dp))
          Text(if (isAr) "استئناف اللعب" else "Resume Battle", fontWeight = FontWeight.Bold)
        }

        OutlinedButton(
          onClick = onRestart,
          border = BorderStroke(1.dp, BronzeBorder),
          modifier = Modifier.fillMaxWidth().height(48.dp).testTag("restart_button"),
        ) {
          Icon(Icons.Default.Refresh, contentDescription = null, tint = RoyalGold)
          Spacer(Modifier.width(6.dp))
          Text(if (isAr) "إعادة المرحلة" else "Restart Stage", color = ParchmentText)
        }

        // Fast Travel to all 8 Realm Zones
        Text(
          text = if (isAr) "الانتقال السريع بين مناطق العالم" else "Realm Zones Quick Travel",
          color = MutedStoneText,
          fontSize = 12.sp,
        )
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
          GameCatalog.zones.chunked(2).forEach { pair ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
              pair.forEach { zone ->
                OutlinedButton(
                  onClick = { onTeleportZone(zone.id) },
                  contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                  border = BorderStroke(1.dp, BronzeBorder),
                  modifier = Modifier.weight(1f).testTag("zone_${zone.id}"),
                ) {
                  Text(zone.name.get(lang), color = ParchmentText, fontSize = 11.sp, maxLines = 1)
                }
              }
            }
          }
        }

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          GraphicsQuality.entries.forEach { q ->
            val sel = state.quality == q
            Surface(
              onClick = { onSetQuality(q) },
              shape = RoundedCornerShape(8.dp),
              color = if (sel) RoyalGold else BronzeCard,
            ) {
              Text(
                text = q.name,
                color = if (sel) ObsidianBg else ParchmentText,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
              )
            }
          }
          TextButton(onClick = onToggleLanguage) {
            Text(if (isAr) "English" else "العربية", color = RoyalGold)
          }
        }

        TextButton(
          onClick = onReturnToHub,
          modifier = Modifier.testTag("return_hub_button"),
        ) {
          Text(if (isAr) "العودة لقائمة المهام" else "Return to Mission Hub", color = MutedStoneText)
        }
      }
    }
  }
}

@Composable
fun OutcomeOverlayDialog(
  isVictory: Boolean,
  state: GameUiState,
  onNextMission: () -> Unit,
  onRetry: () -> Unit,
  onReturnToHub: () -> Unit,
) {
  val lang = state.language
  val isAr = lang == AppLanguage.AR
  val mission = GameCatalog.missions.find { it.id == state.activeMissionId }
  val hasNext = isVictory && !state.isFreeRoam && state.activeMissionId < 7

  Dialog(onDismissRequest = {}) {
    Surface(
      shape = RoundedCornerShape(18.dp),
      color = BronzeSurface,
      border = BorderStroke(2.dp, if (isVictory) RoyalGold else CrimsonHealth),
      modifier = Modifier.widthIn(max = 400.dp),
    ) {
      Column(
        modifier = Modifier.padding(22.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
      ) {
        Text(
          text = if (isVictory) {
            if (isAr) "انتصار مجيد!" else "GLORIOUS VICTORY!"
          } else {
            if (isAr) "لقد سقط المحارب" else "WARRIOR FALLEN"
          },
          style = MaterialTheme.typography.headlineMedium,
          color = if (isVictory) RoyalGold else CrimsonHealth,
          textAlign = TextAlign.Center,
        )

        if (isVictory && mission != null && !state.isFreeRoam) {
          Text(
            text = if (isAr) {
              "المكافأة: +${mission.rewardGold} ذهب • +${mission.rewardXp} خبرة"
            } else {
              "Rewards: +${mission.rewardGold} Gold • +${mission.rewardXp} XP"
            },
            color = EmeraldStamina,
            fontWeight = FontWeight.Bold,
          )
        } else if (!isVictory) {
          Text(
            text = if (isAr) "استخدم الدرع والتفادي وحاول مجدداً" else "Use Block & Dodge Roll and strike again!",
            color = MutedStoneText,
            textAlign = TextAlign.Center,
          )
        }

        if (hasNext) {
          Button(
            onClick = onNextMission,
            colors = ButtonDefaults.buttonColors(containerColor = RoyalGold, contentColor = ObsidianBg),
            modifier = Modifier.fillMaxWidth().height(48.dp).testTag("next_mission_button"),
          ) {
            Text(if (isAr) "المهمة التالية" else "Next Mission", fontWeight = FontWeight.Bold)
          }
        }

        OutlinedButton(
          onClick = onRetry,
          border = BorderStroke(1.dp, BronzeBorder),
          modifier = Modifier.fillMaxWidth().height(48.dp).testTag("retry_mission_button"),
        ) {
          Text(if (isAr) "إعادة اللعب" else "Play Again", color = ParchmentText)
        }

        TextButton(
          onClick = onReturnToHub,
          modifier = Modifier.testTag("outcome_hub_button"),
        ) {
          Text(if (isAr) "قائمة المهام" else "Mission Hub", color = MutedStoneText)
        }
      }
    }
  }
}
