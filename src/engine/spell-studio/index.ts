/**
 * Spell Studio Engine Module
 * Pure simulation and rendering logic, completely decoupled from React
 */

export { SpellStudioEngine } from './SpellStudioEngine';
export { calculateTrajectory, calculateProjectilePosition, calculateSpawnPosition, distance, isWithinRadius } from './TrajectoryMath';
export { calculatePose, calculatePoseAtProgress, interpolatePoses } from './PoseCalculator';
export { solveIK, getArmChain } from './IKResolver';
export * as RenderPipeline from './RenderPipeline';

export type { TrajectoryPoint, TrajectoryParams } from './TrajectoryMath';
export type { PoseParams } from './PoseCalculator';
export type { IKChainDefinition, IKSolveParams } from './IKResolver';
export type {
    RenderContext,
    GridRenderOptions,
    CharacterRenderOptions,
    PathRenderOptions,
    ProjectileRenderOptions,
    DummyEnemyRenderOptions
} from './RenderPipeline';
