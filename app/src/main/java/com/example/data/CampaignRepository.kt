package com.example.data

import android.content.Context

class CampaignRepository(context: Context) {
  private val prefs = context.getSharedPreferences("monster_kingdom_prefs", Context.MODE_PRIVATE)

  fun loadUnlockedMission(): Int = prefs.getInt(KEY_UNLOCKED_MISSION, 1).coerceIn(1, 7)

  fun loadCompletedMissions(): Set<Int> {
    val raw = prefs.getStringSet(KEY_COMPLETED_MISSIONS, emptySet()) ?: emptySet()
    return raw.mapNotNull { it.toIntOrNull() }.toSet()
  }

  fun loadGold(): Int = prefs.getInt(KEY_GOLD, 0)

  fun loadWeapon(): String = prefs.getString(KEY_WEAPON, "broadsword") ?: "broadsword"

  fun loadLanguage(): AppLanguage {
    val code = prefs.getString(KEY_LANGUAGE, "AR") ?: "AR"
    return if (code == "EN") AppLanguage.EN else AppLanguage.AR
  }

  fun loadQuality(): GraphicsQuality {
    val raw = prefs.getString(KEY_QUALITY, "HIGH") ?: "HIGH"
    return runCatching { GraphicsQuality.valueOf(raw) }.getOrDefault(GraphicsQuality.HIGH)
  }

  fun saveLanguage(lang: AppLanguage) {
    prefs.edit().putString(KEY_LANGUAGE, lang.name).apply()
  }

  fun saveWeapon(weaponId: String) {
    prefs.edit().putString(KEY_WEAPON, weaponId).apply()
  }

  fun saveQuality(quality: GraphicsQuality) {
    prefs.edit().putString(KEY_QUALITY, quality.name).apply()
  }

  fun recordMissionVictory(missionId: Int, rewardGold: Int) {
    val currentUnlocked = loadUnlockedMission()
    val nextUnlocked = maxOf(currentUnlocked, (missionId + 1).coerceAtMost(7))
    val completed = loadCompletedMissions().toMutableSet().apply { add(missionId) }
    val newGold = loadGold() + rewardGold

    prefs.edit()
      .putInt(KEY_UNLOCKED_MISSION, nextUnlocked)
      .putStringSet(KEY_COMPLETED_MISSIONS, completed.map { it.toString() }.toSet())
      .putInt(KEY_GOLD, newGold)
      .apply()
  }

  companion object {
    private const val KEY_UNLOCKED_MISSION = "unlocked_mission"
    private const val KEY_COMPLETED_MISSIONS = "completed_missions"
    private const val KEY_GOLD = "gold"
    private const val KEY_WEAPON = "weapon"
    private const val KEY_LANGUAGE = "language"
    private const val KEY_QUALITY = "quality"
  }
}
