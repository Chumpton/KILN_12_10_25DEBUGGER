import { Ally } from '../../../types';
import { renderFriendlyBill } from './renderFriendlyBill';
import { renderSkeletalNPC } from './renderSkeletalNPC';
import { renderGenericAlly } from './renderGenericAlly';

export const renderAlly = (
    ctx: CanvasRenderingContext2D,
    ally: Ally,
    x: number,
    y: number
) => {
    switch (ally.name) {
        case 'Friendly Bill':
            renderFriendlyBill(ctx, ally, x, y);
            break;
        case 'Bones':
            renderSkeletalNPC(ctx, ally, x, y);
            break;
        default:
            renderGenericAlly(ctx, ally, x, y);
            break;
    }
};
