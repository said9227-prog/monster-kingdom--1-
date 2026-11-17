package com.example.data

enum class AppLanguage { AR, EN }

enum class GraphicsQuality { LOW, MEDIUM, HIGH }

enum class ScreenMode { HUB, PLAYING }

data class LocalizedText(val ar: String, val en: String) {
  fun get(lang: AppLanguage): String = if (lang == AppLanguage.AR) ar else en
}

data class WeaponDef(
  val id: String,
  val name: LocalizedText,
  val damage: Int,
  val speedLabel: LocalizedText,
  val rangeLabel: String,
)

data class ZoneDef(
  val id: String,
  val name: LocalizedText,
  val worldId: String,
)

data class MissionDef(
  val id: Int,
  val title: LocalizedText,
  val objective: LocalizedText,
  val difficulty: LocalizedText,
  val rewardGold: Int,
  val rewardXp: Int,
  val enemiesSummary: LocalizedText,
  val worldId: String,
)

data class BossHudState(
  val name: LocalizedText,
  val hp: Int,
  val maxHp: Int,
  val phase: Int,
  val aiState: String,
)

data class RadarMonster(
  val x: Float,
  val z: Float,
  val isBoss: Boolean,
)

data class GameUiState(
  val screenMode: ScreenMode = ScreenMode.HUB,
  val language: AppLanguage = AppLanguage.AR,
  val quality: GraphicsQuality = GraphicsQuality.HIGH,
  val engineReady: Boolean = false,
  val engineError: String? = null,
  val paused: Boolean = false,
  val activeMissionId: Int = 1,
  val isFreeRoam: Boolean = false,
  val missionStatus: String = "IDLE", // IDLE, PLAYING, VICTORY, DEFEAT
  val hp: Int = 220,
  val maxHp: Int = 220,
  val stamina: Int = 100,
  val maxStamina: Int = 100,
  val combo: Int = 0,
  val weaponId: String = "broadsword",
  val playerX: Float = 0f,
  val playerY: Float = 0f,
  val playerZ: Float = 12f,
  val playerYaw: Float = 3.14f,
  val zoneId: String = "town",
  val zoneName: LocalizedText = LocalizedText("المدينة المسورة", "Walled Town"),
  val worldId: String = "medieval-kingdom",
  val gateLocked: Boolean = false,
  val lockOn: Boolean = false,
  val enemiesAlive: Int = 0,
  val kills: Int = 0,
  val totalEnemies: Int = 0,
  val fps: Int = 60,
  val boss: BossHudState? = null,
  val radarMonsters: List<RadarMonster> = emptyList(),
  val unlockedMission: Int = 1,
  val completedMissions: Set<Int> = emptySet(),
  val gold: Int = 0,
  val bannerEvent: LocalizedText? = null,
  val showZoneTeleportSheet: Boolean = false,
)

object GameCatalog {
  val weapons = listOf(
    WeaponDef(
      id = "broadsword",
      name = LocalizedText("السيف الملكي", "Royal Broadsword"),
      damage = 24,
      speedLabel = LocalizedText("سريع", "Fast"),
      rangeLabel = "2.5m",
    ),
    WeaponDef(
      id = "greatsword",
      name = LocalizedText("السيف العظيم", "Imperial Greatsword"),
      damage = 36,
      speedLabel = LocalizedText("متوسط", "Balanced"),
      rangeLabel = "3.0m",
    ),
    WeaponDef(
      id = "battleaxe",
      name = LocalizedText("فأس المعركة", "Runic Battleaxe"),
      damage = 42,
      speedLabel = LocalizedText("ثقيل", "Heavy"),
      rangeLabel = "2.65m",
    ),
    WeaponDef(
      id = "twinblade",
      name = LocalizedText("النصل المزدوج", "Dragon Twinblade"),
      damage = 20,
      speedLabel = LocalizedText("خاطف", "Rapid"),
      rangeLabel = "2.35m",
    ),
  )

  val zones = listOf(
    ZoneDef("town", LocalizedText("المدينة المسورة", "Walled Town"), "medieval-kingdom"),
    ZoneDef("castle", LocalizedText("بوابة القلعة والأسوار", "Castle Gate"), "medieval-kingdom"),
    ZoneDef("river", LocalizedText("النهر والجسور", "River & Bridges"), "medieval-kingdom"),
    ZoneDef("forest", LocalizedText("الغابة الغامضة", "Whispering Forest"), "medieval-kingdom"),
    ZoneDef("goblin_camp", LocalizedText("مخيم الغوبلن", "Goblin Camp"), "medieval-kingdom"),
    ZoneDef("mines", LocalizedText("المناجم القديمة", "Ancient Mines"), "medieval-kingdom"),
    ZoneDef("boss_arena", LocalizedText("حلبة الزعيم الحجرية", "Boss Stone Circle"), "medieval-kingdom"),
    ZoneDef("tournament", LocalizedText("ساحة المبارزة الملكية", "Tournament Arena"), "tournament-arena"),
  )

  val missions = listOf(
    MissionDef(
      id = 1,
      title = LocalizedText("المهمة ١: تعليم القتال الملكي", "Mission 1: Royal Combat Training"),
      objective = LocalizedText("تدرّب على الحركة والهجوم والدفاع واهزم كشافة الغوبلن في ساحة المدينة", "Master movement, block & combo strikes by defeating Goblin Scouts in the plaza"),
      difficulty = LocalizedText("سهل", "Easy"),
      rewardGold = 120,
      rewardXp = 100,
      enemiesSummary = LocalizedText("٣ من وحوش الغوبلن", "3 Goblin Scouts"),
      worldId = "medieval-kingdom",
    ),
    MissionDef(
      id = 2,
      title = LocalizedText("المهمة ٢: وحوش الغابة", "Mission 2: Whispering Forest Hunt"),
      objective = LocalizedText("اعبر الجسر إلى الغابة وطهّرها من الخفافيش ووحش الغابة المدرع", "Cross the river into the forest and defeat Cave Bats & the Forest Beast"),
      difficulty = LocalizedText("عادي", "Normal"),
      rewardGold = 180,
      rewardXp = 160,
      enemiesSummary = LocalizedText("خفافيش + غوبلن + وحش الغابة", "Bats, Stalker & Armored Rhino"),
      worldId = "medieval-kingdom",
    ),
    MissionDef(
      id = 3,
      title = LocalizedText("المهمة ٣: الدفاع عن المدينة", "Mission 3: Siege of the Walled Town"),
      objective = LocalizedText("تصدَّ لموجتين من محاربي الأورك وحاملي الدروع داخل شوارع المدينة", "Repel two waves of Orc Legionaries & Shieldbearers inside the town"),
      difficulty = LocalizedText("متوسط", "Moderate"),
      rewardGold = 250,
      rewardXp = 240,
      enemiesSummary = LocalizedText("٥ من جنود الأورك والغوبلن", "5 Orc Raiders & Shieldbearers"),
      worldId = "medieval-kingdom",
    ),
    MissionDef(
      id = 4,
      title = LocalizedText("المهمة ٤: تحرير مخيم الغوبلن", "Mission 4: Liberate the Goblin Camp"),
      objective = LocalizedText("هاجم مخيم الغوبلن شرق الأسوار واقضِ على زعيم الغوبلن المتوحش", "Storm the eastern Goblin Camp and defeat the Goblin Brute"),
      difficulty = LocalizedText("صعب", "Hard"),
      rewardGold = 320,
      rewardXp = 310,
      enemiesSummary = LocalizedText("٤ وحوش مخيم الغوبلن", "4 Goblin Camp Defenders"),
      worldId = "medieval-kingdom",
    ),
    MissionDef(
      id = 5,
      title = LocalizedText("المهمة ٥: اقتحام القلعة", "Mission 5: Storm the Castle Gates"),
      objective = LocalizedText("البوابة مغلقة! اهزم حراس البوابة لفتح بوابة القلعة ثم طهّر الحامية", "The Castle Gate is locked! Defeat the gatekeepers to unlock it and clear the garrison"),
      difficulty = LocalizedText("صعب جداً", "Very Hard"),
      rewardGold = 420,
      rewardXp = 400,
      enemiesSummary = LocalizedText("حراس البوابة + حامية القلعة", "Gatekeepers & Castle Garrison"),
      worldId = "medieval-kingdom",
    ),
    MissionDef(
      id = 6,
      title = LocalizedText("المهمة ٦: ساحة المبارزة والزعيم العملاق", "Mission 6: Tournament Titan Boss"),
      objective = LocalizedText("ادخل ساحة المبارزة الملكية واهزم العملاق الحديدي الدامي (يتحول عند ٥٠٪ صحة)", "Enter the Tournament Arena and slay the Bloodiron Titan (Enrages at 50% HP)"),
      difficulty = LocalizedText("زعيم", "Boss"),
      rewardGold = 600,
      rewardXp = 650,
      enemiesSummary = LocalizedText("مبارزون + الزعيم العملاق", "Arena Duelists + Bloodiron Titan"),
      worldId = "tournament-arena",
    ),
    MissionDef(
      id = 7,
      title = LocalizedText("المهمة ٧: المعركة النهائية", "Mission 7: Final Kingdom Showdown"),
      objective = LocalizedText("واجه قائد جحافل الأورك وزعيم الذئاب معاً في الحلبة الحجرية القديمة", "Defeat the Warband Overlord & Fenris Wolf-Lord in the Boss Stone Circle"),
      difficulty = LocalizedText("أسطوري", "Legendary"),
      rewardGold = 1000,
      rewardXp = 1200,
      enemiesSummary = LocalizedText("حرس + زعيمان ضخمان", "Guards + Twin Final Bosses"),
      worldId = "medieval-kingdom",
    ),
  )
}
