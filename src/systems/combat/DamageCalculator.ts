import { Player, SpellType, EquipmentItem } from '../../types';
import { SPELL_REGISTRY } from '../../modules/spells/SpellRegistry';
import { BASE_STAT_CONFIG } from '../../constants';

export const calculateSpellDamage = (player: Player, spellType: SpellType): number => {
    const config = SPELL_REGISTRY[spellType];
    const powerDmg = player.baseStats.power * BASE_STAT_CONFIG.POWER.dmgPerPoint;

    let equipDamage = 0;
    Object.values(player.equipment).forEach((item) => {
        const equip = item as EquipmentItem | null;
        if (equip?.stats.damage) equipDamage += equip.stats.damage;
    });

    const spellLevel = player.spellUpgrades?.[spellType] || 1;
    const spellLevelBonus = (spellLevel - 1) * (config.baseStats?.damagePerLevel || 5);

    const rawDmg = (config.baseStats?.baseDamage || 0) + spellLevelBonus + (player.level * 0.5) + equipDamage + powerDmg;
    if (isNaN(rawDmg)) {
        console.error('[DamageCalculator] RawDmg NaN', { configBase: config.baseDamage, level: player.level, equipDamage, powerDmg, stats: player.baseStats });
        return 1;
    }
    const variance = config.damageVariance || 0.1;
    const finalDmg = rawDmg * (1 - variance + Math.random() * variance * 2);

    return finalDmg;
};
