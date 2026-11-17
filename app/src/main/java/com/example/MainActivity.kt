package com.example

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.AppLanguage
import com.example.data.ScreenMode
import com.example.ui.GameViewModel
import com.example.ui.GameWebView
import com.example.ui.components.CampaignHubScreen
import com.example.ui.components.GameHud
import com.example.ui.components.OutcomeOverlayDialog
import com.example.ui.components.PauseOverlayDialog
import com.example.ui.theme.MonsterKingdomTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    enableEdgeToEdge()
    setContent {
      MonsterKingdomTheme {
        MonsterKingdomRoot()
      }
    }
  }
}

@Composable
fun MonsterKingdomRoot(viewModel: GameViewModel = viewModel()) {
  val state by viewModel.uiState.collectAsStateWithLifecycle()
  val layoutDir = if (state.language == AppLanguage.AR) LayoutDirection.Rtl else LayoutDirection.Ltr

  CompositionLocalProvider(LocalLayoutDirection provides layoutDir) {
    Box(modifier = Modifier.fillMaxSize()) {
      // Persistent 3D WebGL + Three.js + Rapier Physics viewport (never reloads GLBs on screen transitions)
      GameWebView(
        viewModel = viewModel,
        modifier = Modifier.fillMaxSize(),
      )

      when (state.screenMode) {
        ScreenMode.HUB -> {
          CampaignHubScreen(
            state = state,
            onStartMission = { id -> viewModel.startMission(id) },
            onStartFreeRoam = { worldId -> viewModel.startFreeRoam(worldId) },
            onPreviewWorld = { worldId -> viewModel.previewWorld(worldId) },
            onToggleLanguage = { viewModel.toggleLanguage() },
            onSetQuality = { q -> viewModel.setQuality(q) },
          )
        }

        ScreenMode.PLAYING -> {
          BackHandler {
            if (state.paused) {
              viewModel.resumeGame()
            } else {
              viewModel.pauseGame()
            }
          }

          GameHud(
            state = state,
            onJoystickMove = { x, y -> viewModel.sendJoystick(x, y) },
            onAttack = { viewModel.sendCommand("ATTACK") },
            onHeavyAttack = { viewModel.sendCommand("HEAVY_ATTACK") },
            onBlockChanged = { active -> viewModel.sendCommand("BLOCK", """{"active":$active}""") },
            onDodge = { viewModel.sendCommand("DODGE") },
            onJump = { viewModel.sendCommand("JUMP") },
            onSelectWeapon = { id -> viewModel.selectWeapon(id) },
            onToggleLockOn = { viewModel.sendCommand("TOGGLE_LOCK_ON") },
            onZoom = { d -> viewModel.sendCommand("ZOOM", """{"delta":$d}""") },
            onToggleLanguage = { viewModel.toggleLanguage() },
            onPause = { viewModel.pauseGame() },
            onOpenZoneMap = { viewModel.pauseGame() },
          )

          if (state.paused || state.showZoneTeleportSheet) {
            PauseOverlayDialog(
              state = state,
              onResume = { viewModel.resumeGame() },
              onRestart = {
                if (state.isFreeRoam) viewModel.startFreeRoam(state.worldId)
                else viewModel.startMission(state.activeMissionId)
              },
              onReturnToHub = { viewModel.returnToHub() },
              onTeleportZone = { zId -> viewModel.teleportToZone(zId) },
              onSetQuality = { q -> viewModel.setQuality(q) },
              onToggleLanguage = { viewModel.toggleLanguage() },
            )
          }

          if (state.missionStatus == "VICTORY" || state.missionStatus == "DEFEAT") {
            OutcomeOverlayDialog(
              isVictory = state.missionStatus == "VICTORY",
              state = state,
              onNextMission = { viewModel.startMission((state.activeMissionId + 1).coerceAtMost(7)) },
              onRetry = {
                if (state.isFreeRoam) viewModel.startFreeRoam(state.worldId)
                else viewModel.startMission(state.activeMissionId)
              },
              onReturnToHub = { viewModel.returnToHub() },
            )
          }
        }
      }
    }
  }
}
