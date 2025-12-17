import { Enemy } from '../../../types';
import { renderAnt } from './renderAnt';
import { renderGolem } from './renderGolem';
import { renderSpitter } from './renderSpitter';
import { renderBoss } from './renderBoss';
import { renderZombie } from './renderZombie';
import { renderDummy } from './renderDummy';

export const renderEnemy = (
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    x: number,
    y: number
) => {
    switch (enemy.type) {
        case 'dummy':
            renderDummy(ctx, enemy, x, y);
            break;
        case 'ant':
            renderAnt(ctx, enemy, x, y);
            break;
        case 'golem':
            renderGolem(ctx, enemy, x, y);
            break;
        case 'spitter':
            renderSpitter(ctx, enemy, x, y);
            break;
        case 'boss':
            renderBoss(ctx, enemy, x, y);
            break;
        case 'melee':
        case 'caster':
        default:
            renderZombie(ctx, enemy, x, y);
            break;
    }
};
