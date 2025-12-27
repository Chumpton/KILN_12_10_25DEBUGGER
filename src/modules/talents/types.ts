import { UnifiedModifier } from "../spells/modifiers";
import { SpellKey } from "../spells/modifiers";

export interface TalentNode {
    id: string;
    name: string;
    description: string;
    icon: string;

    // Layout
    row: number;
    col: number;

    // Requirements
    prerequisites?: string[]; // IDs of other nodes
    requiredSpellLevel?: number; // Spell Level required to unlock
    maxPoints: number;

    // The "Meat": What this talent actually does
    modifier: UnifiedModifier;
}

export interface TalentGraph {
    spellId: SpellKey;
    nodes: Record<string, TalentNode>;
    version: number;
}

export interface TalentState {
    // How many points spent in each node
    // Key: "spellId:nodeId" -> points
    allocations: Record<string, number>;
}
