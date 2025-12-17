import { RigTransforms, PartTransform } from '../../game/spells/editing/SpellEditorTypes';

/**
 * Inverse Kinematics solver for arm chains
 * Pure math, no rendering
 */

export interface IKChainDefinition {
    shoulder: string;
    elbow: string;
    hand: string;
}

export interface IKSolveParams {
    chain: IKChainDefinition;
    target: { x: number; y: number };
    currentTransforms: RigTransforms;
}

/**
 * Solve IK for arm chain
 * Returns updated transforms for the chain
 */
export function solveIK(params: IKSolveParams): Partial<RigTransforms> {
    const { chain, target, currentTransforms } = params;

    // Get current positions
    const shoulder = currentTransforms[chain.shoulder];
    const elbow = currentTransforms[chain.elbow];
    const hand = currentTransforms[chain.hand];

    if (!shoulder || !elbow || !hand) {
        return {};
    }

    // Simple 2-bone IK using law of cosines
    const shoulderPos = { x: shoulder.x, y: shoulder.y };
    const targetDist = Math.sqrt(
        Math.pow(target.x - shoulderPos.x, 2) +
        Math.pow(target.y - shoulderPos.y, 2)
    );

    // Upper arm and forearm lengths (approximate from current pose)
    const upperArmLength = Math.sqrt(
        Math.pow(elbow.x - shoulder.x, 2) +
        Math.pow(elbow.y - shoulder.y, 2)
    );
    const forearmLength = Math.sqrt(
        Math.pow(hand.x - elbow.x, 2) +
        Math.pow(hand.y - elbow.y, 2)
    );

    // Clamp target to reachable distance
    const maxReach = upperArmLength + forearmLength;
    const clampedDist = Math.min(targetDist, maxReach * 0.95);

    // Calculate angles using law of cosines
    const angleToTarget = Math.atan2(
        target.y - shoulderPos.y,
        target.x - shoulderPos.x
    );

    // Elbow angle
    const cosElbow = (
        upperArmLength * upperArmLength +
        forearmLength * forearmLength -
        clampedDist * clampedDist
    ) / (2 * upperArmLength * forearmLength);

    const elbowAngle = Math.acos(Math.max(-1, Math.min(1, cosElbow)));

    // Shoulder angle
    const cosShoulder = (
        upperArmLength * upperArmLength +
        clampedDist * clampedDist -
        forearmLength * forearmLength
    ) / (2 * upperArmLength * clampedDist);

    const shoulderAngle = angleToTarget - Math.acos(Math.max(-1, Math.min(1, cosShoulder)));

    // Return updated rotations
    return {
        [chain.shoulder]: {
            ...shoulder,
            rotation: shoulderAngle
        },
        [chain.elbow]: {
            ...elbow,
            rotation: shoulderAngle + elbowAngle
        }
    };
}

/**
 * Get IK chain definition for left/right arm
 */
export function getArmChain(side: 'LEFT' | 'RIGHT'): IKChainDefinition {
    if (side === 'LEFT') {
        return {
            shoulder: 'shoulder_l',
            elbow: 'elbow_l',
            hand: 'hand_l'
        };
    } else {
        return {
            shoulder: 'shoulder_r',
            elbow: 'elbow_r',
            hand: 'hand_r'
        };
    }
}
