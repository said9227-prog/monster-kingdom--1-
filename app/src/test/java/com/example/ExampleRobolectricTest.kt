package com.example

import android.app.Application
import android.content.Context
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ApplicationProvider
import com.example.data.AppLanguage
import com.example.data.CampaignRepository
import com.example.data.GameCatalog
import com.example.data.GameUiState
import com.example.data.GraphicsQuality
import com.example.ui.GameViewModel
import com.example.ui.components.CampaignHubScreen
import com.example.ui.components.GameHud
import com.example.ui.theme.MonsterKingdomTheme
import java.nio.ByteBuffer
import java.nio.ByteOrder
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

  @get:Rule val composeTestRule = createComposeRule()

  @Test
  fun appName_matchesMonsterKingdom() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("Monster Kingdom", appName)
  }

  @Test
  fun bundledGlbAssets_existAndHaveValidBinaryGlbMagic() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val requiredAssets = listOf(
      "worlds/medieval-kingdom/model.glb",
      "worlds/tournament-arena/model.glb",
      "models/warrior/KnightCaptain.glb",
      "models/monsters/minion-a01.glb",
      "models/monsters/minion-a02.glb",
      "models/monsters/minion-b01.glb",
      "models/monsters/minion-b02.glb",
      "models/monsters/minion-c01.glb",
      "models/monsters/minion-c02.glb",
      "models/monsters/minion-d01.glb",
      "models/monsters/minion-d02.glb",
      "models/monsters/Anglerfish.glb",
      "models/monsters/Bat.glb",
      "models/monsters/Corgi.glb",
      "models/monsters/Duck.glb",
      "models/monsters/Hippo.glb",
      "models/monsters/Jellyfish.glb",
      "models/monsters/Platypus.glb",
      "models/monsters/Red.glb",
      "models/monsters/Rhino.glb",
      "models/monsters/Shark.glb",
      "models/monsters/OrcLegionary.glb",
      "models/monsters/OrcShieldBearer.glb",
      "models/monsters/OrcWarbandChampion.glb",
      "models/monsters/BloodironJuggernaut.glb",
      "models/monsters/WerewolfCaptain.glb",
    )

    for (assetPath in requiredAssets) {
      context.assets.open(assetPath).use { stream ->
        val header = ByteArray(12)
        val read = stream.read(header)
        assertEquals("Header bytes for $assetPath", 12, read)
        val bb = ByteBuffer.wrap(header).order(ByteOrder.LITTLE_ENDIAN)
        val magic = bb.int
        val version = bb.int
        assertEquals("GLB magic for $assetPath", 0x46546C67, magic)
        assertEquals("glTF v2 for $assetPath", 2, version)
      }
    }
  }

  @Test
  fun campaignRepository_unlocksNextMissionAndPersistsGold() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val repo = CampaignRepository(context)
    assertEquals(1, repo.loadUnlockedMission())

    repo.recordMissionVictory(1, 120)
    assertEquals(2, repo.loadUnlockedMission())
    assertTrue(repo.loadCompletedMissions().contains(1))
    assertEquals(120, repo.loadGold())
  }

  @Test
  fun gameViewModel_parsesTelemetryAndEventsCorrectly() {
    val app = ApplicationProvider.getApplicationContext<Application>()
    val vm = GameViewModel(app)

    vm.onGameEventJson("""{"type":"ENGINE_READY","data":{}}""")
    assertTrue(vm.uiState.value.engineReady)

    vm.onTelemetryJson(
      """
      {
        "hp": 180,
        "maxHp": 220,
        "stamina": 75,
        "maxStamina": 100,
        "zoneId": "boss_arena",
        "zoneNameAr": "حلبة الزعيم الحجرية",
        "zoneNameEn": "Boss Stone Circle",
        "enemiesAlive": 1,
        "fps": 58,
        "boss": {"nameAr":"العملاق الحديدي","nameEn":"Bloodiron Titan","hp":300,"maxHp":720,"phase":2,"state":"ATTACK"},
        "radarMonsters": [{"x": -30.0, "z": -27.0, "isBoss": true}]
      }
      """.trimIndent()
    )

    val st = vm.uiState.value
    assertEquals(180, st.hp)
    assertEquals("boss_arena", st.zoneId)
    assertNotNull(st.boss)
    assertEquals(2, st.boss?.phase)
    assertEquals(1, st.radarMonsters.size)
    assertTrue(st.radarMonsters[0].isBoss)

    vm.toggleLanguage()
    assertEquals(AppLanguage.EN, vm.uiState.value.language)
  }

  @Test
  fun campaignHub_displaysAll7MissionsAndTriggersStart() {
    var startedMission = -1
    var previewedWorld = ""
    composeTestRule.setContent {
      MonsterKingdomTheme {
        CampaignHubScreen(
          state = GameUiState(engineReady = true, language = AppLanguage.EN, quality = GraphicsQuality.HIGH),
          onStartMission = { startedMission = it },
          onStartFreeRoam = {},
          onPreviewWorld = { previewedWorld = it },
          onToggleLanguage = {},
          onSetQuality = {},
        )
      }
    }
    composeTestRule.waitForIdle()
    composeTestRule.onNodeWithTag("continue_campaign_button").assertIsDisplayed()
    composeTestRule.onNodeWithTag("free_roam_button").assertIsDisplayed()
    composeTestRule.onNodeWithTag("tournament_arena_button").assertIsDisplayed()
    composeTestRule.onNodeWithTag("preview_arena_button").assertIsDisplayed().performClick()
    assertEquals("tournament-arena", previewedWorld)
    composeTestRule.onNodeWithTag("toggle_missions_drawer").performClick()
    composeTestRule.waitForIdle()
    composeTestRule.onNodeWithTag("start_mission_1").performClick()
    assertEquals(1, startedMission)
    assertEquals(7, GameCatalog.missions.size)
    assertEquals(8, GameCatalog.zones.size)
  }

  @Test
  fun gameHud_rendersJoystickCombatControlsAndMinimap() {
    var attacked = false
    composeTestRule.setContent {
      MonsterKingdomTheme {
        GameHud(
          state = GameUiState(engineReady = true, enemiesAlive = 3),
          onJoystickMove = { _, _ -> },
          onAttack = { attacked = true },
          onHeavyAttack = {},
          onBlockChanged = {},
          onDodge = {},
          onJump = {},
          onSelectWeapon = {},
          onToggleLockOn = {},
          onZoom = {},
          onToggleLanguage = {},
          onPause = {},
          onOpenZoneMap = {},
        )
      }
    }
    composeTestRule.waitForIdle()
    composeTestRule.onNodeWithTag("virtual_joystick").assertIsDisplayed()
    composeTestRule.onNodeWithTag("attack_button").assertIsDisplayed().performClick()
    composeTestRule.onNodeWithTag("heavy_attack_button").assertIsDisplayed()
    composeTestRule.onNodeWithTag("block_button").assertIsDisplayed()
    composeTestRule.onNodeWithTag("dodge_button").assertIsDisplayed()
    composeTestRule.onNodeWithTag("minimap_widget").assertIsDisplayed()
    assertTrue(attacked)
    assertFalse(GameCatalog.weapons.isEmpty())
  }
}
