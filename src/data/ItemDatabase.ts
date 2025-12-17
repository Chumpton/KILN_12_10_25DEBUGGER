/**
 * Item Database - Proxy to new ItemRegistry
 */

import { ITEM_REGISTRY } from '../content/items/ItemRegistry';
import { EquipmentItem } from '../types';

export const ITEM_DATABASE: Record<string, EquipmentItem> = ITEM_REGISTRY;
