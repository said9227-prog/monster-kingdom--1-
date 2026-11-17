package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AppLanguage
import com.example.data.CampaignRepository
import com.example.data.GameCatalog
import com.example.data.GameUiState
import com.example.data.GraphicsQuality
import com.example.data.LocalizedText
import com.example.data.RadarMonster
import com.example.data.BossHudState
import com.example.data.ScreenMode
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import org.json.JSONObject

class GameViewModel(application: Application) : AndroidViewModel(application) {
  private val repo = CampaignRepository(application)

  private val _uiState = MutableStateFlow(
    GameUiState(
      language = repo.loadLanguage(),
      quality = repo.loadQuality(),
      weaponId = repo.loadWeapon(),
      unlockedMission = repo.loadUnlockedMission(),
      completedMissions = repo.loadCompletedMissions(),
      gold = repo.loadGold(),
    )
  )
  val uiState: StateFlow<GameUiState> = _uiState.asStateFlow()

  private var commandSink: ((String, String) -> Unit)? = null

  fun attachCommandSink(sink: (String, String) -> Unit) {
    commandSink = sink
    if (_uiState.value.engineReady) {
      sendCommand("SET_QUALITY", """{"quality":"${_uiState.value.quality.name}"}""")
      sendCommand("SET_WEAPON", """{"weaponId":"${_uiState.value.weaponId}"}""")
    }
  }

  fun sendCommand(cmd: String, payloadJson: String = "{}") {
    commandSink?.invoke(cmd, payloadJson)
  }

  fun sendJoystick(x: Float, y: Float) {
    val mag = kotlin.math.hypot(x, y)
    val run = mag > 0.55f
    sendCommand("JOYSTICK", """{"x":$x,"y":$y,"run":$run}""")
  }

  fun toggleLanguage() {
    val next = if (_uiState.value.language == AppLanguage.AR) AppLanguage.EN else AppLanguage.AR
    repo.saveLanguage(next)
    _uiState.update { it.copy(language = next) }
  }

  fun selectWeapon(weaponId: String) {
    repo.saveWeapon(weaponId)
    _uiState.update { it.copy(weaponId = weaponId) }
    sendCommand("SET_WEAPON", """{"weaponId":"$weaponId"}""")
  }

  fun setQuality(quality: GraphicsQuality) {
    repo.saveQuality(quality)
    _uiState.update { it.copy(quality = quality) }
    sendCommand("SET_QUALITY", """{"quality":"${quality.name}"}""")
  }

  fun startMission(missionId: Int) {
    _uiState.update {
      it.copy(
        screenMode = ScreenMode.PLAYING,
        activeMissionId = missionId,
        isFreeRoam = false,
        paused = false,
        missionStatus = "PLAYING",
        showZoneTeleportSheet = false,
      )
    }
    sendCommand("START_MISSION", """{"missionId":$missionId}""")
    sendCommand("SET_WEAPON", """{"weaponId":"${_uiState.value.weaponId}"}""")
  }

  fun startFreeRoam(worldId: String) {
    _uiState.update {
      it.copy(
        screenMode = ScreenMode.PLAYING,
        isFreeRoam = true,
        paused = false,
        missionStatus = "PLAYING",
        showZoneTeleportSheet = false,
      )
    }
    sendCommand("START_FREE_ROAM", """{"worldId":"$worldId"}""")
    sendCommand("SET_WEAPON", """{"weaponId":"${_uiState.value.weaponId}"}""")
  }

  fun teleportToZone(zoneId: String) {
    _uiState.update { it.copy(showZoneTeleportSheet = false, paused = false) }
    sendCommand("RESUME")
    sendCommand("TELEPORT_ZONE", """{"zoneId":"$zoneId"}""")
  }

  fun toggleZoneTeleportSheet(show: Boolean) {
    _uiState.update { it.copy(showZoneTeleportSheet = show) }
  }

  fun previewWorld(worldId: String) {
    _uiState.update { it.copy(worldId = worldId) }
    sendCommand("PREVIEW_WORLD", """{"worldId":"$worldId"}""")
  }

  fun pauseGame() {
    _uiState.update { it.copy(paused = true) }
    sendCommand("PAUSE")
  }

  fun resumeGame() {
    _uiState.update { it.copy(paused = false, showZoneTeleportSheet = false) }
    sendCommand("RESUME")
  }

  fun returnToHub() {
    val curWorld = _uiState.value.worldId
    _uiState.update {
      it.copy(
        screenMode = ScreenMode.HUB,
        paused = false,
        showZoneTeleportSheet = false,
      )
    }
    sendCommand("PREVIEW_WORLD", """{"worldId":"$curWorld"}""")
  }

  fun onTelemetryJson(raw: String) {
    val json = runCatching { JSONObject(raw) }.getOrNull() ?: return
    val bossObj = json.optJSONObject("boss")
    val boss = bossObj?.let {
      BossHudState(
        name = LocalizedText(it.optString("nameAr"), it.optString("nameEn")),
        hp = it.optInt("hp"),
        maxHp = it.optInt("maxHp", 1),
        phase = it.optInt("phase", 1),
        aiState = it.optString("state", "CHASE"),
      )
    }
    val radarArray = json.optJSONArray("radarMonsters")
    val radar = buildList {
      if (radarArray != null) {
        for (i in 0 until radarArray.length()) {
          val m = radarArray.optJSONObject(i) ?: continue
          add(
            RadarMonster(
              x = m.optDouble("x", 0.0).toFloat(),
              z = m.optDouble("z", 0.0).toFloat(),
              isBoss = m.optBoolean("isBoss", false),
            )
          )
        }
      }
    }

    _uiState.update { cur ->
      cur.copy(
        hp = json.optInt("hp", cur.hp),
        maxHp = json.optInt("maxHp", cur.maxHp),
        stamina = json.optInt("stamina", cur.stamina),
        maxStamina = json.optInt("maxStamina", cur.maxStamina),
        combo = json.optInt("combo", 0),
        playerX = json.optDouble("playerX", 0.0).toFloat(),
        playerY = json.optDouble("playerY", 0.0).toFloat(),
        playerZ = json.optDouble("playerZ", 0.0).toFloat(),
        playerYaw = json.optDouble("playerYaw", 0.0).toFloat(),
        zoneId = json.optString("zoneId", cur.zoneId),
        zoneName = LocalizedText(
          json.optString("zoneNameAr", cur.zoneName.ar),
          json.optString("zoneNameEn", cur.zoneName.en),
        ),
        worldId = json.optString("worldId", cur.worldId),
        gateLocked = json.optBoolean("gateLocked", false),
        lockOn = json.optBoolean("lockOn", false),
        enemiesAlive = json.optInt("enemiesAlive", 0),
        kills = json.optInt("kills", 0),
        totalEnemies = json.optInt("totalEnemies", 0),
        fps = json.optInt("fps", 60),
        missionStatus = json.optString("missionStatus", cur.missionStatus),
        boss = boss,
        radarMonsters = radar,
      )
    }
  }

  fun onGameEventJson(raw: String) {
    val json = runCatching { JSONObject(raw) }.getOrNull() ?: return
    val type = json.optString("type")
    val data = json.optJSONObject("data") ?: JSONObject()

    when (type) {
      "ENGINE_READY" -> {
        _uiState.update { it.copy(engineReady = true, engineError = null) }
        sendCommand("SET_QUALITY", """{"quality":"${_uiState.value.quality.name}"}""")
        sendCommand("SET_WEAPON", """{"weaponId":"${_uiState.value.weaponId}"}""")
      }
      "ERROR" -> {
        _uiState.update { it.copy(engineError = data.optString("message", "Engine error")) }
      }
      "GATE_UNLOCKED" -> {
        showBanner(
          LocalizedText(
            "تم فتح بوابة القلعة! تقدّم إلى الداخل!",
            "Castle Gate Unlocked! Advance inside!"
          )
        )
      }
      "BOSS_PHASE_2" -> {
        val nameAr = data.optString("nameAr", "الزعيم")
        val nameEn = data.optString("nameEn", "Boss")
        showBanner(
          LocalizedText(
            "غضب الزعيم $nameAr — المرحلة الثانية!",
            "$nameEn Enraged — Phase II!"
          )
        )
      }
      "VICTORY" -> {
        val mId = data.optInt("missionId", _uiState.value.activeMissionId)
        val mission = GameCatalog.missions.find { it.id == mId }
        if (mission != null && !_uiState.value.isFreeRoam) {
          repo.recordMissionVictory(mId, mission.rewardGold)
          _uiState.update {
            it.copy(
              missionStatus = "VICTORY",
              unlockedMission = repo.loadUnlockedMission(),
              completedMissions = repo.loadCompletedMissions(),
              gold = repo.loadGold(),
            )
          }
        }
      }
      "DEFEAT" -> {
        _uiState.update { it.copy(missionStatus = "DEFEAT") }
      }
    }
  }

  private fun showBanner(text: LocalizedText) {
    _uiState.update { it.copy(bannerEvent = text) }
    viewModelScope.launch {
      delay(3200)
      _uiState.update { cur ->
        if (cur.bannerEvent == text) cur.copy(bannerEvent = null) else cur
      }
    }
  }
}
