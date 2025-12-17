import { Player, EquipmentItem, BaseStatConfig, ClassConfig, PlayerBaseStats } from '../../types';
import { BASE_STAT_CONFIG, CLASS_CONFIG } from '../../constants';
import { CARD_REGISTRY } from '../../modules/cards/CardRegistry';

/**
 * Calculates a player's derived stats (MaxHP, MaxShield) based on their base stats,
 * their class, level, and equipment.
 */
export const recalculatePlayerStats = (p: Player) => {
    // 1. Get Class Config
    const classConfig = CLASS_CONFIG[p.heroClass] || CLASS_CONFIG.MAGE;
    const baseVit = classConfig.stats.vitality;

    // 2. Calculate Max HP
    let baseHp = classConfig.hp +
        (p.level * 5) +
        ((p.baseStats.vitality + baseVit) * BASE_STAT_CONFIG.VITALITY.hpPerPoint);

    // Apply Card Modifiers
    if (p.equippedCards) {
        Object.values(p.equippedCards).forEach(list => {
            list?.forEach(inst => {
                const def = CARD_REGISTRY[inst.cardId];
                if (def && def.effects) {
                    def.effects.forEach(eff => {
                        if (eff.type === 'BEHAVIOR_MOD' && eff.behaviorTag === 'REDUCE_MAX_HP' && eff.genericData?.percent) {
                            baseHp *= (1.0 - eff.genericData.percent);
                        }
                    });
                }
            });
        });
    }

    p.maxHp = Math.round(baseHp);
    if (p.hp > p.maxHp) p.hp = p.maxHp;

    // 3. Calculate Max Shield from Equipment
    let maxShield = 50 + (p.level * 10);
    Object.values(p.equipment).forEach((itemVal) => {
        const item = itemVal as EquipmentItem | null;
        if (item?.stats.shield) maxShield += item.stats.shield;
    });

    p.maxShield = maxShield;
    if (p.shield > maxShield) p.shield = maxShield;
};

/**
 * Checks if the player has enough XP to level up, and applies leveling logic if so.
 */
export const checkLevelUp = (p: Player, onBossSpawn?: () => void) => {
    if (p.xp >= p.toNextLevel) {
        p.level++;
        p.statPoints++;

        // Helper for spell talents (every 2 levels)
        if (p.level % 2 === 0) p.spellTalentPoints++;

        // Helper for Boss Spawns (every 5 levels)
        if (p.level % 5 === 0 && onBossSpawn) onBossSpawn();

        p.xp -= p.toNextLevel;
        p.toNextLevel = Math.floor(p.toNextLevel * 1.5);

        // Heal on level up
        p.hp = p.maxHp;
        p.mana = p.maxMana;

        recalculatePlayerStats(p);
    }
};
