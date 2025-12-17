import React, { useState, useEffect, useRef } from 'react';
import { GameState, Vector2, WorldObject, Enemy } from '../../types';
import { GEOMETRIC_TREES, renderGeometricTree } from './GeometricTrees';
import { toWorld, toScreen } from '../../utils/isometric';
import { PlayerRenderer } from '../player/render/PlayerRenderer';
import { EnemyRenderer } from '../enemies/EnemyRenderer';
import { TileSystem, TileType, tileSystem } from '../world/TileSystem';
import { renderSquirrel } from '../../utils/renderers/animals/renderSquirrel';
import { renderBunny } from '../../utils/renderers/animals/renderBunny';
import { renderWolf } from '../../utils/renderers/animals/renderWolf';



interface WorldEditorProps {
    gameStateRef: React.MutableRefObject<GameState | undefined>;
    isActive: boolean;
    onClose: () => void;
}

export const WorldEditor: React.FC<WorldEditorProps> = ({
    gameStateRef,
    isActive,
    onClose
}) => {
    const [worldObjects, setWorldObjects] = useState<WorldObject[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<{ id: string; path: string; type: 'geometric' | 'png' | 'tile' | 'animal' } | null>(null);
    const [selectedObject, setSelectedObject] = useState<string | null>(null);
    const [hoveredTile, setHoveredTile] = useState<Vector2 | null>(null);
    const [previewScale, setPreviewScale] = useState(1.0); // State for current placement scale
    const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null); // Track hovered object for scaling
    const isMouseDown = useRef(false); // Track mouse button for drag-painting
    const savedPlayerPosRef = useRef<Vector2 | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
    const playerRendererRef = useRef<PlayerRenderer>(new PlayerRenderer());
    const enemyRendererRef = useRef<EnemyRenderer>(new EnemyRenderer());

    const isLoadedRef = useRef(false);

    const [tileMapVersion, setTileMapVersion] = useState(0); // Tick to trigger re-renders on tile changes

    // Geometric trees as assets
    const geometricAssets = GEOMETRIC_TREES.map(tree => ({
        id: tree.id,
        name: tree.name,
        type: 'geometric' as const
    }));

    const animalAssets = [
        { id: 'squirrel', name: 'Squirrel', path: 'squirrel_rig', type: 'animal' as const },
        { id: 'bunny', name: 'Bunny', path: 'bunny_rig', type: 'animal' as const },
        { id: 'wolf', name: 'Wolf', path: 'wolf_rig', type: 'animal' as const }
    ];

    // PNG assets (placeholder - you'll add real ones)
    const pngAssets = [
        { id: 'tree_oak', name: 'Oak Tree', path: 'world_edit/tree_oak.png', type: 'png' as const },
        { id: 'tree_custom', name: 'Custom Tree', path: 'world_edit/tree_custom.png', type: 'png' as const },
        { id: 'rock_large', name: 'Large Rock', path: 'world_edit/rock_large.png', type: 'png' as const },
        { id: 'rock_custom', name: 'Rock', path: 'world_edit/rock.png', type: 'png' as const },
        { id: 'flower', name: 'Flower', path: 'world_edit/flower.png', type: 'png' as const },
        { id: 'flower_pink', name: 'Pink Flower', path: 'world_edit/PinkFlower.png', type: 'png' as const },
        { id: 'flower_white', name: 'White Flower', path: 'world_edit/WhiteFlower.png', type: 'png' as const },
        { id: 'flower_yellow', name: 'Yellow Flower', path: 'world_edit/Yellow Flower.png', type: 'png' as const },
        { id: 'flower_red', name: 'Red Flower', path: 'world_edit/Red Flower.png', type: 'png' as const },
        { id: 'portal', name: 'Portal', path: 'world_edit/Portal.png', type: 'png' as const },
        { id: 'box', name: 'Box', path: 'world_edit/Box.png', type: 'png' as const },
        { id: 'torch', name: 'Torch', path: 'world_edit/Torch.png', type: 'png' as const },
        { id: 'tent', name: 'Tent', path: 'world_edit/Tent.png', type: 'png' as const },
        { id: 'bush_green', name: 'Green Bush', path: 'world_edit/bush_green.png', type: 'png' as const },
        { id: 'statue_angel', name: 'Angel Statue', path: 'world_edit/statue_angel.png', type: 'png' as const },
        { id: 'health_orb', name: 'Health Orb', path: 'world_edit/Health Orb.png', type: 'png' as const },
        { id: 'campfire', name: 'Campfire', path: 'world_edit/CampFire.png', type: 'png' as const },
    ];

    // Tile assets
    const tileAssets = [
        { id: 'grass', name: 'Grass (Auto)', path: 'world_edit/tile_custom_grass.png' },
        { id: 'grass_2', name: 'Grass 2', path: 'world_edit/tile_grass_2.png' },
        { id: 'grass_4x4', name: 'Grass (4x4)', path: 'world_edit/Grass42.png' },
        { id: 'grass_4x4_2', name: 'Grass (4x4) 2', path: 'world_edit/tile_grass_4x4_2.png' },
        { id: 'grass_4x4_3', name: 'Grass (4x4) 3', path: 'world_edit/grass43.png' },
        { id: 'grass_2x2', name: 'Grass (2x2)', path: 'world_edit/tile_grass_2x2.png' },
        { id: 'grass_edged_2x2', name: 'Grass (Edged 2x2)', path: 'world_edit/tile_grass_edged_2x2.png' },
        { id: 'grass_6x6', name: 'Grass (6x6)', path: 'world_edit/grass_6x6.png' },
        { id: 'dirt', name: 'Dirt (Auto)', path: 'world_edit/tile_dirt.png' },
        { id: 'dirt_4x4', name: 'Dirt (4x4)', path: 'world_edit/dirt 4x4.png' },
        { id: 'dirt_2x2', name: 'Dirt (2x2)', path: 'world_edit/tile_dirt_2x2.png' },
        { id: 'dirt_1x1', name: 'Dirt (1x1)', path: 'world_edit/Dirt1x1.png' },
        { id: 'dirt_beaten', name: 'Beaten Dirt', path: 'world_edit/tile_dirt_beaten.png' },
        { id: 'stone', name: 'Stone (Auto)', path: 'world_edit/rock_large.png' },
        { id: 'none', name: 'Eraser', path: 'world_edit/test.png' }, // Eraser
    ];

    // Preload PNGs
    useEffect(() => {
        [...pngAssets, ...tileAssets].forEach(asset => {
            const img = new Image();
            img.src = asset.path;
            imageCache.current.set(asset.path, img);
        });
    }, []);

    // Sync world objects when editor activates
    useEffect(() => {
        const state = gameStateRef.current;
        if (!state) return;

        if (isActive) {
            isLoadedRef.current = false; // Reset load state

            // Load existing objects from game state
            if (state.worldObjects) {
                setWorldObjects([...state.worldObjects]);
            }
            // Force Sync: Ensure editor TileSystem matches GameState
            if (state.tileMap) {
                tileSystem.importData(state.tileMap);
            }
            setTileMapVersion(v => v + 1);

            // Mark as loaded so sync can happen
            setTimeout(() => {
                isLoadedRef.current = true;
            }, 50);
        }
    }, [isActive, gameStateRef]);

    // Sync changes to GameState in real-time
    useEffect(() => {
        const sync = () => {
            if (gameStateRef.current && isLoadedRef.current) {
                gameStateRef.current.worldObjects = worldObjects;
                gameStateRef.current.tileMap = tileSystem.exportData();
                gameStateRef.current.tileVersion = (gameStateRef.current.tileVersion || 0) + 1;
            }
        };

        if (isActive && isLoadedRef.current) {
            sync();
        }

        return () => {
            if (isActive && isLoadedRef.current) {
                sync();
            }
        };
    }, [worldObjects, isActive, gameStateRef, tileMapVersion]);

    // Handle Scroll Wheel (Scaling), Mouse Move (Hover/Paint), and Click/Drag State
    useEffect(() => {
        if (!isActive) return;

        const handleWheel = (e: WheelEvent) => {
            if (hoveredObjectId) {
                // Scale existing object
                const delta = e.deltaY < 0 ? 0.1 : -0.1;
                setWorldObjects(prev => prev.map(obj =>
                    obj.id === hoveredObjectId
                        ? { ...obj, scale: Math.max(0.1, Math.min(5.0, obj.scale + delta)) }
                        : obj
                ));
            } else if (selectedAsset) {
                // Scale preview
                const delta = e.deltaY < 0 ? 0.1 : -0.1;
                setPreviewScale(prev => Math.max(0.1, Math.min(5.0, prev + delta)));
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest('.world-editor-panel')) return;
            isMouseDown.current = true;

            // Eraser Logic: Delete Object if clicked
            if (selectedAsset?.id === 'none' && hoveredObjectId) {
                setWorldObjects(prev => prev.filter(obj => obj.id !== hoveredObjectId));
                if (selectedObject === hoveredObjectId) {
                    setSelectedObject(null);
                }
                return;
            }

            // Trigger immediate placement on click
            if (hoveredTile && !hoveredObjectId && selectedAsset) {
                performPlacement(hoveredTile);
            }
        };

        const handleMouseUp = () => {
            isMouseDown.current = false;
        };

        const handleMouseMove = (e: MouseEvent) => {
            const state = gameStateRef.current;
            if (!state || !canvasRef.current) return;

            const canvas = canvasRef.current;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const playerScreen = toScreen(state.player.pos.x, state.player.pos.y);
            const offsetX = centerX - playerScreen.x;
            const offsetY = centerY - playerScreen.y;

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Check for hovered object for scaling
            let foundObjId: string | null = null;
            // Iterate backwards to find top-most object
            for (let i = worldObjects.length - 1; i >= 0; i--) {
                const obj = worldObjects[i];
                const objScreen = toScreen(obj.pos.x, obj.pos.y);
                const objX = objScreen.x + offsetX;
                const objY = objScreen.y + offsetY;
                const dist = Math.sqrt(Math.pow(mouseX - objX, 2) + Math.pow(mouseY - objY, 2));
                if (dist < 30) {
                    foundObjId = obj.id;
                    break;
                }
            }
            setHoveredObjectId(foundObjId);

            // Drag Erasing Objects
            if (isMouseDown.current && selectedAsset?.id === 'none' && foundObjId) {
                setWorldObjects(prev => prev.filter(obj => obj.id !== foundObjId));
                if (selectedObject === foundObjId) {
                    setSelectedObject(null);
                }
                // Continue to prevent tile painting
            }

            // Calculate Mouse World Position
            const worldPos = toWorld(mouseX - offsetX, mouseY - offsetY);
            const tileX = Math.round(worldPos.x);
            const tileY = Math.round(worldPos.y);

            // Only update if tile changed
            const newTile = { x: tileX, y: tileY };
            if (!hoveredTile || hoveredTile.x !== newTile.x || hoveredTile.y !== newTile.y) {
                setHoveredTile(newTile);

                // Drag Painting
                if (isMouseDown.current && selectedAsset && !foundObjId) {
                    performPlacement(newTile);
                }
            }
        };

        window.addEventListener('wheel', handleWheel);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isActive, hoveredObjectId, selectedAsset, worldObjects, gameStateRef, hoveredTile]);

    // Handle Delete Key
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedObject) {
                    handleDeleteObject(selectedObject);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, selectedObject]);

    // Handle Render Loop
    useEffect(() => {
        if (!isActive) return;

        let animationFrameId: number;

        const render = () => {
            const canvas = canvasRef.current;
            const state = gameStateRef.current;
            const ctx = canvas?.getContext('2d');

            if (canvas && ctx && state) {
                // Resize Canvas to Window
                if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                }

                // Clear Canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Calculate Camera Offset
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const playerScreen = toScreen(state.player.pos.x, state.player.pos.y);
                const offsetX = centerX - playerScreen.x;
                const offsetY = centerY - playerScreen.y;

                // 1. Separate Tiles and Vertical Objects
                const tileObjects: WorldObject[] = [];
                const verticalObjects: { type: 'object' | 'player' | 'enemy', zIndex: number, data?: any }[] = [];

                worldObjects.forEach(obj => {
                    if (obj.assetType === 'tile') {
                        tileObjects.push(obj);
                    } else {
                        verticalObjects.push({
                            type: 'object',
                            zIndex: obj.zIndex,
                            data: obj
                        });
                    }
                });

                // Add Player to Vertical Objects
                const playerZIndex = Math.floor(state.player.pos.y * 100);
                verticalObjects.push({
                    type: 'player',
                    zIndex: playerZIndex
                });

                // Add Enemies to Vertical Objects
                state.enemies.forEach(enemy => {
                    if (enemy.isDead && enemy.deathTimer <= 0) return;
                    verticalObjects.push({
                        type: 'enemy',
                        zIndex: Math.floor(enemy.pos.y * 100),
                        data: enemy
                    });
                });

                // 2. Render Tiles First (Background Layer)
                // Use TileSystem for tiles
                const visibleTiles = tileSystem.exportData();

                visibleTiles.forEach(tile => {
                    const screenPos = toScreen(tile.x, tile.y);
                    const drawX = screenPos.x + offsetX;
                    const drawY = screenPos.y + offsetY;

                    // Get Texture from ID (via TileSystem)
                    const texturePath = tileSystem.getTexture(tile);
                    if (!texturePath) return;

                    const img = imageCache.current.get(texturePath);

                    ctx.save();
                    // Highlight if hovered
                    if (tile.x === hoveredTile?.x && tile.y === hoveredTile?.y && selectedAsset?.type === 'tile') {
                        ctx.shadowColor = '#fbbf24';
                        ctx.shadowBlur = 10;
                        ctx.globalAlpha = 0.9;
                    }

                    if (img && img.complete) {
                        ctx.translate(drawX, drawY);
                        // No scale support for grid tiles yet, standard 1.0
                        // Tiles are floor, draw centered
                        ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    }
                    ctx.restore();
                });

                // 3. Render Vertical Objects Sorted by Z (Trees, Walls, Player, Enemies)
                verticalObjects.sort((a, b) => a.zIndex - b.zIndex);

                verticalObjects.forEach(item => {
                    if (item.type === 'object' && item.data) {
                        const obj = item.data;
                        const screenPos = toScreen(obj.pos.x, obj.pos.y);
                        const drawX = screenPos.x + offsetX;
                        const drawY = screenPos.y + offsetY;

                        ctx.save();

                        // Highlight
                        if (obj.id === selectedObject || obj.id === hoveredObjectId) {
                            ctx.shadowColor = obj.id === selectedObject ? '#fbbf24' : '#fff';
                            ctx.shadowBlur = obj.id === selectedObject ? 15 : 10;
                        }

                        if (obj.assetType === 'geometric') {
                            renderGeometricTree(ctx, obj.assetPath, drawX, drawY, obj.scale);
                        } else if (obj.assetType === 'animal') {
                            if (obj.assetPath === 'bunny_rig' || obj.id.includes('bunny')) { // assetPath from list is 'bunny_rig'
                                renderBunny(ctx, drawX, drawY, obj.scale, true, true, obj.pos.x, obj.pos.y);
                            } else if (obj.assetPath === 'wolf_rig' || obj.id.includes('wolf')) {
                                try {
                                    renderWolf(ctx, drawX, drawY, obj.scale, true, true, obj.pos.x, obj.pos.y);
                                } catch (e) {
                                    console.warn("Wolf Render Error:", e);
                                }
                            } else {
                                renderSquirrel(ctx, drawX, drawY, obj.scale, true, true, obj.pos.x, obj.pos.y);
                            }
                        } else if (obj.assetType === 'png' || obj.assetType === 'floor_prop') {
                            const img = imageCache.current.get(obj.assetPath);
                            if (img && img.complete) {
                                ctx.translate(drawX, drawY);
                                ctx.scale(obj.scale, obj.scale);
                                // Floor props are centered (flat on ground), Upright PNGs are bottom-anchored
                                if (obj.assetType === 'floor_prop') {
                                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                                } else {
                                    ctx.drawImage(img, -img.width / 2, -img.height);
                                }
                            }
                        }
                        // Note: Tiles already handled above

                        ctx.restore();
                    } else if (item.type === 'player') {
                        const pScreen = toScreen(state.player.pos.x, state.player.pos.y);
                        playerRendererRef.current.render(
                            ctx,
                            state.player,
                            pScreen.x + offsetX,
                            pScreen.y + offsetY,
                            null, // Move Target
                            true, // Hide UI
                            undefined, // Forced Facing
                            true // isWorldEditorActive
                        );
                    } else if (item.type === 'enemy' && item.data) {
                        const enemy = item.data as Enemy;
                        const eScreen = toScreen(enemy.pos.x, enemy.pos.y);
                        enemyRendererRef.current.render(
                            ctx,
                            enemy,
                            eScreen.x + offsetX,
                            eScreen.y + offsetY
                        );
                    }
                });

                // 2. Draw Hovered Tile Highlight
                if (hoveredTile) {
                    const tileScreen = toScreen(hoveredTile.x, hoveredTile.y);
                    const tileX = tileScreen.x + offsetX;
                    const tileY = tileScreen.y + offsetY;

                    ctx.save();
                    ctx.translate(tileX, tileY);

                    ctx.beginPath();
                    ctx.moveTo(0, -16); // Top
                    ctx.lineTo(32, 0);  // Right
                    ctx.lineTo(0, 16);  // Bottom
                    ctx.lineTo(-32, 0); // Left
                    ctx.closePath();

                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
                    ctx.fill();

                    // Draw Coords Text
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${hoveredTile.x},${hoveredTile.y}`, 0, 4);

                    ctx.restore();

                    // 3. Draw Placement Preview (Ghost)
                    if (selectedAsset && !hoveredObjectId) {
                        ctx.save();
                        ctx.globalAlpha = 0.6; // Transparent ghost

                        // Use previewScale here
                        const scale = previewScale;

                        if (selectedAsset.type === 'geometric') {
                            renderGeometricTree(ctx, selectedAsset.path, tileX, tileY, scale);
                        } else if (selectedAsset.type === 'png') {
                            const img = imageCache.current.get(selectedAsset.path);
                            if (img && img.complete) {
                                ctx.translate(tileX, tileY);
                                ctx.scale(scale, scale);
                                ctx.drawImage(img, -img.width / 2, -img.height);
                            }
                        } else if (selectedAsset.type === 'animal') {
                            if (selectedAsset.id === 'bunny') {
                                renderBunny(ctx, tileX, tileY, scale, true, true);
                            } else if (selectedAsset.id === 'wolf') {
                                try {
                                    renderWolf(ctx, tileX, tileY, scale, true, true);
                                } catch (e) {
                                    console.warn("Wolf Preview Render Error:", e);
                                }
                            } else {
                                renderSquirrel(ctx, tileX, tileY, scale, true, true);
                            }
                        } else if (selectedAsset.type === 'tile') {
                            const img = imageCache.current.get(selectedAsset.path);
                            if (img && img.complete) {
                                ctx.translate(tileX, tileY);
                                ctx.scale(scale, scale);
                                ctx.drawImage(img, -img.width / 2, -img.height / 2);
                            }
                        }

                        ctx.restore();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isActive, worldObjects, selectedAsset, selectedObject, hoveredTile, gameStateRef, hoveredObjectId, previewScale]);

    // Separated Placement Logic
    const performPlacement = (targetTile: Vector2) => {
        if (!selectedAsset) return;

        // Special Case: Grass 2x2 and Dirt 2x2 should be placed as a prop (Object) to allow layering above ground
        if (selectedAsset.id === 'grass_2x2' || selectedAsset.id === 'dirt_2x2' || selectedAsset.id === 'grass_edged_2x2' || selectedAsset.id === 'dirt_beaten') {
            handlePlaceObject(targetTile, 'floor_prop');
            return;
        }

        if (selectedAsset.type === 'tile') {
            // Paint Tile
            tileSystem.setTile(targetTile.x, targetTile.y, selectedAsset.id as TileType);
            setTileMapVersion(v => v + 1);
        } else {
            // Place Object
            handlePlaceObject(targetTile);
        }
    };

    // Handle canvas click to place/select (Simplified - mostly handled by mousedown now for placement)
    useEffect(() => {
        if (!isActive) return;

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.world-editor-panel') || target.tagName === 'BUTTON') return;

            if (hoveredObjectId) {
                // Select existing object
                setSelectedObject(hoveredObjectId);
                return;
            } else {
                // Deselect if clicking empty space
                setSelectedObject(null);
            }
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [isActive, hoveredObjectId]);

    const handlePlaceObject = (worldPos: Vector2, overrideType?: string) => {
        if (!selectedAsset) return;

        let currentObjects = [...worldObjects];

        // If placing a tile (via TileSystem), logic handled in performPlacement. This func is for Objects.
        // But if we overrideType, we proceed.

        // Z-Index Layering: Check for existing objects at similar position to layer safely
        let baseZ = Math.floor(worldPos.y * 100);

        // Find highest Z at this location (radius 0.5)
        const overlapping = currentObjects.filter(o =>
            Math.abs(o.pos.x - worldPos.x) < 0.5 &&
            Math.abs(o.pos.y - worldPos.y) < 0.5
        );

        if (overlapping.length > 0) {
            const maxZ = Math.max(...overlapping.map(o => o.zIndex));
            if (maxZ >= baseZ) {
                baseZ = maxZ + 1; // Increment to layer on top
            }
        }

        const newObject: WorldObject = {
            id: `obj_${Date.now()}_${Math.random()}`,
            assetPath: selectedAsset.path,
            assetType: (overrideType || selectedAsset.type) as any,
            pos: { ...worldPos },
            scale: previewScale,
            zIndex: baseZ,
            width: imageCache.current.get(selectedAsset.path)?.width || 64,
            height: imageCache.current.get(selectedAsset.path)?.height || 64
        };

        setWorldObjects([...currentObjects, newObject]);
    };

    const handleSelectObject = (objectId: string | null) => {
        setSelectedObject(objectId);
    };

    const handleScaleObject = (objectId: string, delta: number) => {
        setWorldObjects(worldObjects.map(obj =>
            obj.id === objectId
                ? { ...obj, scale: Math.max(0.1, Math.min(5.0, obj.scale + delta)) }
                : obj
        ));
    };

    const handleDeleteObject = (objectId: string) => {
        setWorldObjects(worldObjects.filter(obj => obj.id !== objectId));
        if (selectedObject === objectId) {
            handleSelectObject(null);
        }
    };

    const handleSaveWorld = async () => {
        try {
            // Optimistic save
            const response = await fetch('/save-world-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    objects: worldObjects,
                    tileMap: tileSystem.exportData()
                })
            });

            if (response.ok) {
                alert('✅ World Successfully Saved to Codebase! \n(src/data/WorldObjects.ts updated)');
            } else {
                throw new Error('Server returned ' + response.status);
            }
        } catch (e) {
            console.error('Save failed:', e);
            alert('⚠️ Save failed (Check console). Copying to clipboard instead.');
            const code = generateWorldCode(worldObjects);
            navigator.clipboard.writeText(code);
        }
    };

    const handleCloseEditor = () => {
        handleSelectObject(null);
        setSelectedAsset(null);
        onClose();
    };

    const generateWorldCode = (objects: WorldObject[]): string => {
        const objectsCode = objects.map(obj => `    {
        id: '${obj.id}',
        assetPath: '${obj.assetPath}',
        assetType: '${obj.assetType}',
        pos: { x: ${obj.pos.x.toFixed(2)}, y: ${obj.pos.y.toFixed(2)} },
        scale: ${obj.scale.toFixed(2)},
        zIndex: ${obj.zIndex}
    }`).join(',\n');

        return `// Generated World Objects
export const WORLD_OBJECTS: WorldObject[] = [
${objectsCode}
];

// MANUAL COPY FOR TILEMAP NOT IMPLEMENTED IN CLIPBOARD FALLBACK YET
`;
    };

    if (!isActive) return null;

    const selectedObj = worldObjects.find(obj => obj.id === selectedObject);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
            pointerEvents: 'none'
        }}>
            {/* Fullscreen Overlay Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'auto'
                }}
            />

            {/* Asset Browser Panel */}
            <div className="world-editor-panel" style={{
                position: 'absolute',
                top: 60,
                left: 10,
                width: 280,
                maxHeight: '80vh',
                background: 'rgba(0, 0, 0, 0.95)',
                border: '2px solid #fbbf24',
                borderRadius: 8,
                padding: 10,
                pointerEvents: 'auto',
                overflowY: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                    color: '#fbbf24',
                    fontWeight: 'bold'
                }}>
                    <span>🌍 World Assets</span>
                    <button
                        onClick={handleCloseEditor}
                        style={{
                            background: '#ef4444',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: 4,
                            cursor: 'pointer'
                        }}
                    >
                        Exit Editor
                    </button>
                </div>

                <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
                    Click an asset, then click on the world to place it.
                    <br />
                    <span style={{ color: '#fbbf24' }}>Scroll Wheel:</span> Scale | <span style={{ color: '#fbbf24' }}>Delete Key:</span> Remove
                </div>

                {/* Animals Section */}
                <div style={{ marginBottom: 15 }}>
                    <div style={{
                        color: '#ec4899',
                        fontWeight: 'bold',
                        fontSize: 12,
                        marginBottom: 5,
                        borderBottom: '1px solid #ec4899',
                        paddingBottom: 3
                    }}>
                        🐾 Animals
                    </div>
                    {animalAssets.map(asset => (
                        <div
                            key={asset.id}
                            onClick={() => setSelectedAsset({ id: asset.id, path: asset.path, type: asset.type })}
                            style={{
                                padding: 8,
                                marginBottom: 5,
                                background: selectedAsset?.path === asset.path ? '#ec4899' : '#2a2a2a',
                                color: selectedAsset?.path === asset.path ? '#fff' : '#fff',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 11,
                                border: selectedAsset?.path === asset.path ? '2px solid #fff' : '1px solid #444',
                                transition: 'all 0.2s'
                            }}
                        >
                            🐿️ {asset.name}
                        </div>
                    ))}
                </div>

                {/* Geometric Trees Section */}
                <div style={{ marginBottom: 15 }}>
                    <div style={{
                        color: '#10b981',
                        fontWeight: 'bold',
                        fontSize: 12,
                        marginBottom: 5,
                        borderBottom: '1px solid #10b981',
                        paddingBottom: 3
                    }}>
                        📐 Geometric Trees
                    </div>
                    {geometricAssets.map(asset => (
                        <div
                            key={asset.id}
                            onClick={() => setSelectedAsset({ id: asset.id, path: asset.id, type: 'geometric' })}
                            style={{
                                padding: 8,
                                marginBottom: 5,
                                background: selectedAsset?.path === asset.id ? '#10b981' : '#2a2a2a',
                                color: selectedAsset?.path === asset.id ? '#000' : '#fff',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 11,
                                border: selectedAsset?.path === asset.id ? '2px solid #fff' : '1px solid #444',
                                transition: 'all 0.2s'
                            }}
                        >
                            🌲 {asset.name}
                        </div>
                    ))}
                </div>

                {/* PNG Assets Section */}
                <div>
                    <div style={{
                        color: '#3b82f6',
                        fontWeight: 'bold',
                        fontSize: 12,
                        marginBottom: 5,
                        borderBottom: '1px solid #3b82f6',
                        paddingBottom: 3
                    }}>
                        🖼️ PNG Assets
                    </div>
                    {pngAssets.map(asset => (
                        <div
                            key={asset.id}
                            onClick={() => setSelectedAsset({ id: asset.id, path: asset.path, type: 'png' })}
                            style={{
                                padding: 8,
                                marginBottom: 5,
                                background: selectedAsset?.path === asset.path ? '#3b82f6' : '#2a2a2a',
                                color: selectedAsset?.path === asset.path ? '#fff' : '#ccc',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 11,
                                border: selectedAsset?.path === asset.path ? '2px solid #fff' : '1px solid #444',
                                transition: 'all 0.2s'
                            }}
                        >
                            📄 {asset.name}
                        </div>
                    ))}
                </div>

                {/* Tile Assets Section */}
                <div style={{ marginTop: 15 }}>
                    <div style={{
                        color: '#f59e0b',
                        fontWeight: 'bold',
                        fontSize: 12,
                        marginBottom: 5,
                        borderBottom: '1px solid #f59e0b',
                        paddingBottom: 3
                    }}>
                        🔲 Tiles
                    </div>
                    {tileAssets.map(asset => (
                        <div
                            key={asset.id}
                            onClick={() => setSelectedAsset({ id: asset.id, path: asset.path, type: 'tile' })}
                            style={{
                                padding: 8,
                                marginBottom: 5,
                                background: selectedAsset?.path === asset.path ? '#f59e0b' : '#2a2a2a',
                                color: selectedAsset?.path === asset.path ? '#000' : '#ccc',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 11,
                                border: selectedAsset?.path === asset.path ? '2px solid #fff' : '1px solid #444',
                                transition: 'all 0.2s'
                            }}
                        >
                            🔲 {asset.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Object Properties Panel */}
            {selectedObj && (
                <div className="world-editor-panel" style={{
                    position: 'absolute',
                    top: 60,
                    right: 10,
                    width: 250,
                    background: 'rgba(0, 0, 0, 0.95)',
                    border: '2px solid #fbbf24',
                    borderRadius: 8,
                    padding: 10,
                    pointerEvents: 'auto',
                    color: 'white'
                }}>
                    <div style={{
                        color: '#fbbf24',
                        fontWeight: 'bold',
                        marginBottom: 10
                    }}>
                        🎨 Object Properties
                    </div>

                    <div style={{ fontSize: 11, marginBottom: 8 }}>
                        <strong>Type:</strong> {selectedObj.assetType === 'geometric' ? '📐 Geometric' : '🖼️ PNG'}
                    </div>

                    <div style={{ fontSize: 11, marginBottom: 8 }}>
                        <strong>Asset:</strong> {selectedObj.assetPath.split('/').pop()}
                    </div>

                    <div style={{ fontSize: 11, marginBottom: 8 }}>
                        <strong>Position:</strong> ({selectedObj.pos.x.toFixed(1)}, {selectedObj.pos.y.toFixed(1)})
                    </div>

                    <div style={{ fontSize: 11, marginBottom: 10 }}>
                        <strong>Scale:</strong> {selectedObj.scale.toFixed(2)}x
                        <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                            <button
                                onClick={() => handleScaleObject(selectedObj.id, -0.1)}
                                style={buttonStyle}
                            >
                                −
                            </button>
                            <button
                                onClick={() => handleScaleObject(selectedObj.id, 0.1)}
                                style={buttonStyle}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => handleDeleteObject(selectedObj.id)}
                        style={{
                            ...buttonStyle,
                            background: '#ef4444',
                            width: '100%'
                        }}
                    >
                        🗑️ Delete Object
                    </button>
                    <div style={{ marginTop: 5, fontSize: 10, color: '#aaa', textAlign: 'center' }}>
                        (Or press Delete key)
                    </div>
                </div>
            )}

            {/* Bottom Control Panel */}
            <div className="world-editor-panel" style={{
                position: 'absolute',
                bottom: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.95)',
                border: '2px solid #fbbf24',
                borderRadius: 8,
                padding: 10,
                pointerEvents: 'auto',
                display: 'flex',
                gap: 10,
                alignItems: 'center'
            }}>
                <div style={{ color: '#fbbf24', fontSize: 11 }}>
                    Objects: {worldObjects.length}
                </div>
                <button
                    onClick={handleSaveWorld}
                    style={{
                        ...buttonStyle,
                        background: '#10b981',
                        fontWeight: 'bold'
                    }}
                >
                    💾 Save World
                </button>
                <button
                    onClick={() => setWorldObjects([])}
                    style={{
                        ...buttonStyle,
                        background: '#ef4444'
                    }}
                >
                    🗑️ Clear All
                </button>
            </div>

            {/* Instructions */}
            <div style={{
                position: 'absolute',
                top: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid #fbbf24',
                borderRadius: 4,
                padding: '5px 15px',
                pointerEvents: 'none',
                color: '#fbbf24',
                fontSize: 11
            }}>
                🌍 WORLD EDITOR - Editing Mode
                {selectedAsset && hoveredTile && !hoveredObjectId && (
                    <span style={{ marginLeft: 10, color: '#10b981' }}>
                        → Placing at ({hoveredTile.x}, {hoveredTile.y}) | Scale: {previewScale.toFixed(2)}x
                    </span>
                )}
                {hoveredObjectId && (
                    <span style={{ marginLeft: 10, color: '#3b82f6' }}>
                        → Hovering Object
                    </span>
                )}
            </div>
        </div >
    );
};

const buttonStyle: React.CSSProperties = {
    background: '#444',
    border: '1px solid #666',
    color: '#fff',
    padding: '5px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 11
};
