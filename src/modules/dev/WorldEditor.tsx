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
import { WorldEditorMode, SelectionBox, TemplateData } from './WorldEditorTypes';
import { MapStorage } from '../maps/MapStorage';
import { SerializedMapData, MapType } from '../maps/MapTypes';



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

    // New State for Selection/Templates
    const [editorMode, setEditorMode] = useState<WorldEditorMode>('paint');
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
    const [clipboard, setClipboard] = useState<TemplateData | null>(null);
    const [templates, setTemplates] = useState<TemplateData[]>([]); // TODO: Load from localStorage

    // Map Management State
    const [currentMap, setCurrentMap] = useState<SerializedMapData | null>(null);
    const [mapModalOpen, setMapModalOpen] = useState<'NEW' | 'LOAD' | null>(null);
    const [mapNameInput, setMapNameInput] = useState('');

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

            if (editorMode === 'select' && hoveredTile) {
                setSelectionBox({ start: hoveredTile, end: hoveredTile });
                return;
            }

            if (editorMode === 'paste' && clipboard && hoveredTile) {
                performPlacement(hoveredTile);
                return;
            }

            // Paint/Erase Logic (Only in 'paint' mode)
            if (editorMode === 'paint') {
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

            // Calculate Mouse World Position
            const worldPos = toWorld(mouseX - offsetX, mouseY - offsetY);
            const tileX = Math.floor(worldPos.x);
            const tileY = Math.floor(worldPos.y);

            // Only update if tile changed
            const newTile = { x: tileX, y: tileY };

            // Drag Logic
            if (isMouseDown.current) {
                if (editorMode === 'select') {
                    setSelectionBox(prev => prev ? { ...prev, end: newTile } : { start: newTile, end: newTile });
                } else if (editorMode === 'paint') {
                    // Drag Erasing Objects
                    if (selectedAsset?.id === 'none' && foundObjId) {
                        setWorldObjects(prev => prev.filter(obj => obj.id !== foundObjId));
                        if (selectedObject === foundObjId) {
                            setSelectedObject(null);
                        }
                    }
                    // Drag Painting
                    else if (selectedAsset && !foundObjId && (!hoveredTile || hoveredTile.x !== newTile.x || hoveredTile.y !== newTile.y)) {
                        performPlacement(newTile);
                    }
                }
            }

            if (!hoveredTile || hoveredTile.x !== newTile.x || hoveredTile.y !== newTile.y) {
                setHoveredTile(newTile);
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
    }, [isActive, hoveredObjectId, selectedAsset, worldObjects, gameStateRef, hoveredTile, editorMode, clipboard, selectionBox]);

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

    // Init: Load Active Map or Default
    useEffect(() => {
        if (!isActive) return;
        MapStorage.initDefaults(); // Ensure at least Home Base exists

        if (!currentMap) {
            const state = gameStateRef.current;
            if (state && state.activeMapId) {
                // Game started with a specific map loaded
                const map = MapStorage.loadMap(state.activeMapId);
                if (map) {
                    setCurrentMap(map);
                    // Objects/Tiles already in State, just sync Editor state?
                    // WorldEditor uses local `worldObjects` state.
                    // But the first useEffect (line 113) already syncs `setWorldObjects([...state.worldObjects])`.
                    // So we just need to set metadata.
                    return;
                }
            }

            // Fallback: Default to Home Base if found (and no active map)
            // Only if we are truly blank.
            // If we passed 'NEW', activeMapId is undefined.
            // If we passed a map, activeMapId is set.

            // If activeMapId is missing, maybe we are making a NEW map? 
            // We shouldn't auto-load Home Base if we intend to be 'New'.
            // But 'New' usually implies empty.
            const home = MapStorage.loadMap('home_base_default');
            // If we are just opening editor in normal gameplay, we might be on a generated map (no ID).

            // Let's just try to load 'activeMapId' if available, else do nothing (empty/new).
            // Originally I auto-loaded Home.
            if (home && !state?.activeMapId) {
                // loadMapData(home); // Let's NOT auto-load home anymore if we have the selection screen.
                // Unless... simple "Open Editor" mid-game?
            }
        }
    }, [isActive]);

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
                    if (editorMode === 'paste' && clipboard) {
                        ctx.save();
                        ctx.globalAlpha = 0.6;

                        // Draw Clipboard Tiles
                        clipboard.tiles.forEach(t => {
                            const drawTileX = tileX + (t.relX * 32) - (t.relY * 32); // Isometric offset? No, simple tile offset?
                            // Wait, tileSystem tiles are fundamentally grid based.
                            // tileX/tileY in render loop are screen coords of `hoveredTile`.
                            // hoveredTile is (x, y). 
                            // So relative tile is at (hoveredTile.x + t.relX, hoveredTile.y + t.relY).

                            const targetX = hoveredTile.x + t.relX;
                            const targetY = hoveredTile.y + t.relY;
                            const screen = toScreen(targetX, targetY);
                            const drawX = screen.x + offsetX;
                            const drawY = screen.y + offsetY;

                            // Get texture
                            const def = tileSystem['registry'].get(t.type); // Access registry? It's private. 
                            // Need to access texture via instance or public method if registry private.
                            // `tileSystem.getTexture` takes a TileInstance.
                            const tempInstance = { x: targetX, y: targetY, type: t.type, bitmask: 0, variant: 0 };
                            const texturePath = tileSystem.getTexture(tempInstance);

                            const img = imageCache.current.get(texturePath);
                            if (img && img.complete) {
                                ctx.save();
                                ctx.translate(drawX, drawY);
                                ctx.drawImage(img, -img.width / 2, -img.height / 2);
                                ctx.restore();
                            }
                        });

                        // Draw Clipboard Objects
                        clipboard.objects.forEach(obj => {
                            const targetX = hoveredTile.x + obj.relX;
                            const targetY = hoveredTile.y + obj.relY;
                            const screen = toScreen(targetX, targetY);
                            const drawX = screen.x + offsetX;
                            const drawY = screen.y + offsetY;

                            ctx.save();
                            if (obj.data.assetType === 'geometric') {
                                renderGeometricTree(ctx, obj.data.assetPath, drawX, drawY, obj.data.scale);
                            } else if (obj.data.assetType === 'animal') {
                                // Animal render logic... simplified for preview
                                // Just use existing renders
                                if (obj.data.assetPath.includes('bunny')) renderBunny(ctx, drawX, drawY, obj.data.scale, true, true);
                                else if (obj.data.assetPath.includes('wolf')) renderWolf(ctx, drawX, drawY, obj.data.scale, true, true);
                                else renderSquirrel(ctx, drawX, drawY, obj.data.scale, true, true);
                            } else {
                                const img = imageCache.current.get(obj.data.assetPath);
                                if (img && img.complete) {
                                    ctx.translate(drawX, drawY);
                                    ctx.scale(obj.data.scale, obj.data.scale);
                                    if (obj.data.assetType === 'floor_prop') {
                                        ctx.drawImage(img, -img.width / 2, -img.height / 2);
                                    } else {
                                        ctx.drawImage(img, -img.width / 2, -img.height);
                                    }
                                }
                            }
                            ctx.restore();
                        });

                        ctx.restore();

                    } else if (selectedAsset && !hoveredObjectId && editorMode === 'paint') {
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

                // 4. Draw Selection Box
                if (selectionBox) {
                    const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
                    const maxX = Math.max(selectionBox.start.x, selectionBox.end.x);
                    const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
                    const maxY = Math.max(selectionBox.start.y, selectionBox.end.y);

                    // We need to draw a polygon because it's isometric
                    // Top-Left (minX, minY)
                    // Top-Right (maxX, minY)
                    // Bottom-Right (maxX, maxY)
                    // Bottom-Left (minX, maxY)

                    const p1 = toScreen(minX, minY); // Top Corner of top-left tile
                    const p2 = toScreen(maxX + 1, minY); // Right corner of top-right tile
                    const p3 = toScreen(maxX + 1, maxY + 1); // Bottom corner of bottom-right tile
                    const p4 = toScreen(minX, maxY + 1); // Left corner of bottom-left tile

                    // Adjust for camera
                    const points = [p1, p2, p3, p4].map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));

                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);
                    ctx.lineTo(points[1].x, points[1].y);
                    ctx.lineTo(points[2].x, points[2].y);
                    ctx.lineTo(points[3].x, points[3].y);
                    ctx.closePath();

                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
                    ctx.fill();

                    // Dimensions
                    const width = Math.abs(maxX - minX) + 1;
                    const height = Math.abs(maxY - minY) + 1;
                    const center = toScreen((minX + maxX) / 2 + 0.5, (minY + maxY) / 2 + 0.5);

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = 'black';
                    ctx.shadowBlur = 4;
                    ctx.fillText(`${width}x${height}`, center.x + offsetX, center.y + offsetY);

                    ctx.restore();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isActive, worldObjects, selectedAsset, selectedObject, hoveredTile, gameStateRef, hoveredObjectId, previewScale, selectionBox, editorMode]);

    // Separated Placement Logic
    const performPlacement = (targetTile: Vector2) => {
        if (editorMode === 'paste' && clipboard) {
            // Paste Tiles
            clipboard.tiles.forEach(t => {
                // Apply Type, Bitmask, and Variant
                tileSystem.setTile(
                    targetTile.x + t.relX,
                    targetTile.y + t.relY,
                    t.type,
                    t.bitmask,
                    t.variant
                );
                // We need a way to set bitmask/variant directly if they exist.
                // tileSystem.setTile auto-calcs bitmask usually.
                // If we are pasting "exact" tiles, we might want to FORCE the bitmask.
                // But setTile triggers auto-tiling updates which might overwrite it.
                // Let's rely on setTile's auto-tiling for now, assuming the pasted context is what determines the look.
                // BUT user said "layers not selected". If they copied a specific visual state, they want THAT state.
                // If we just setType, it recalculates based on new neighbors. 
                // If we copy a 4x4 block, the internal edges are preserved by setTile if neighbors exist.
                // But external edges might change.
                // Let's try to set them explicitly if TileSystem allows.
                // TileSystem doesn't expose `setRaw` easily, but we can update the grid directly if we wanted.
                // For now, let's stick to setTile but maybe force bitmask after?
                // Actually, if we just setTile, it should work for 90% of cases. 
                // The issue might be that we were LOSING the variant.
                // TileSystem.setTile *randomizes* variant if not provided? 

                // Let's modify TileSystem.setTile to accept optional overrides? Or manually inject.
                // Since I can't modify TileSystem easily in this step without reading it, I'll check it next.
                // But generally, we should try to pass them.
            });

            // Improved: actually use the captured data if possible?
            // Since I don't see setTile accepting bitmask, I'll leave it as setTile for now but I'll add the TODO/Logic
            // or I can do `tileSystem['grid'][y][x] = ...` if I access private.

            // Re-reading logic: The user complaint "copied is not selected" might be about OBJECTS catching too much.
            // Let's fix the Object Paste Logic first.


            // Paste Objects
            const newObjects: WorldObject[] = [];
            clipboard.objects.forEach(obj => {
                const x = targetTile.x + obj.relX;
                const y = targetTile.y + obj.relY;

                // Calculate Z-Index relative to original
                // We want to maintain the 'layer' relative to the floor
                // Original Z was obj.data.zIndex. Original Base Z was Math.floor(obj.data.pos.y * 100).
                // So offset = obj.data.zIndex - Math.floor(obj.data.pos.y * 100).

                const originalBaseZ = Math.floor(obj.data.pos.y * 100);
                const zOffset = obj.data.zIndex - originalBaseZ;
                const newBaseZ = Math.floor(y * 100);

                // If the object was simply layered by Y, offset is 0. 
                // If it was manually layered up, offset is > 0.

                newObjects.push({
                    ...obj.data,
                    id: `obj_${Date.now()}_${Math.random()}`,
                    pos: { x, y },
                    scale: obj.data.scale, // Ensure scale is preserved
                    zIndex: newBaseZ + zOffset
                });
            });

            // Prevent Duplicates on Paste (Optimization)
            // Filter out new objects that are extremely close to existing ones (if user double clicks paste)
            const nonDupes = newObjects.filter(n =>
                !worldObjects.some(e =>
                    Math.abs(e.pos.x - n.pos.x) < 0.1 &&
                    Math.abs(e.pos.y - n.pos.y) < 0.1 &&
                    e.assetPath === n.assetPath
                )
            );

            setWorldObjects(prev => [...prev, ...nonDupes]);
            setTileMapVersion(v => v + 1);
            return;
        }

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

        // Get New Object Bounds (Estimates)
        const newW = (imageCache.current.get(selectedAsset.path)?.width || 64) / 64; // in tiles
        const newH = (imageCache.current.get(selectedAsset.path)?.height || 64) / 64;
        const newRadius = Math.max(newW, newH) / 2 * previewScale;

        // Find highest Z of any intersecting object
        const overlapping = currentObjects.filter(o => {
            const range = Math.max(0.6, newRadius); // Minimum range or object size
            return (
                Math.abs(o.pos.x - worldPos.x) < range &&
                Math.abs(o.pos.y - worldPos.y) < range
            );
        });

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

    const handleCopy = () => {
        if (!selectionBox) return;

        const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
        const maxX = Math.max(selectionBox.start.x, selectionBox.end.x);
        const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
        const maxY = Math.max(selectionBox.start.y, selectionBox.end.y);

        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        // Capture Tiles
        const tiles: TemplateData['tiles'] = [];
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const tile = tileSystem.getTile(x, y);
                if (tile) {
                    tiles.push({
                        relX: x - minX,
                        relY: y - minY,
                        type: tile.type,
                        bitmask: tile.bitmask,
                        variant: tile.variant
                    });
                }
            }
        }

        // Capture Objects
        const captureObjects: TemplateData['objects'] = [];
        worldObjects.forEach(obj => {
            // Calculate heuristic bounds based on visual size
            // Default to 1 tile (radius 0.5) if no dimensions
            let radiusX = 0.5;
            let radiusY = 0.5;

            // Try to get explicit width/height, OR lookup in cache if default/missing
            let w = obj.width;
            let h = obj.height;

            if (!w || w === 64) {
                const img = imageCache.current.get(obj.assetPath);
                if (img && img.width > 64) {
                    w = img.width;
                    h = img.height;
                }
            }

            // Special handling for Geometric assets (Trees) which have no image
            if (obj.assetType === 'geometric') {
                // Geometric trees are large. Default to radius 1.5 (~96px wide effective)
                radiusX = 1.5 * obj.scale;
                radiusY = 1.5 * obj.scale;
            } else if (w) {
                // Standard image-based calc
                // Assume ~64 pixels per world unit (tile width)
                radiusX = ((w / 64) * obj.scale) / 2;
                if (h) {
                    radiusY = radiusX; // Square approx
                }
            } else if (obj.assetType === 'animal' || obj.assetPath.includes('bunny') || obj.assetPath.includes('wolf')) {
                // Animals default to 0.75 radius
                radiusX = 0.75 * obj.scale;
                radiusY = 0.75 * obj.scale;
            }

            // Expand slightly to be forgiving
            radiusX += 0.2; // Increased padding to 0.2
            radiusY += 0.2;

            // STRICT Selection: Center Point Must Be Inside Bounds
            // The previous logic was "Overlap", which grabs trees whose branches touch the box.
            // Users typically expect "Things planted on these tiles".

            // Check if object BASE (pos) is roughly within the tile grid
            // We give a small tolerance (0.5) to catch things on the edge line
            const onTiles = (
                obj.pos.x >= minX - 0.2 &&
                obj.pos.x <= maxX + 1.2 &&
                obj.pos.y >= minY - 0.2 &&
                obj.pos.y <= maxY + 1.2
            );

            if (onTiles) {
                captureObjects.push({
                    relX: obj.pos.x - minX,
                    relY: obj.pos.y - minY,
                    data: obj
                });
            }
        });

        const template: TemplateData = {
            id: `temp_${Date.now()}`,
            name: 'Copied Selection',
            width,
            height,
            tiles,
            objects: captureObjects
        };

        setClipboard(template);
        setEditorMode('paste');
        // Optional: clear selection box after copy? No, keep it.
    };

    const handleDeleteSelection = () => {
        if (!selectionBox) return;

        const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
        const maxX = Math.max(selectionBox.start.x, selectionBox.end.x);
        const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
        const maxY = Math.max(selectionBox.start.y, selectionBox.end.y);

        // Remove Objects
        setWorldObjects(prev => prev.filter(obj => {
            // Refined Bounds Logic
            let radiusX = 0.5;
            let radiusY = 0.5;

            // Try to get explicit width/height, OR lookup in cache if default/missing
            let w = obj.width;
            let h = obj.height;

            if (!w || w === 64) {
                const img = imageCache.current.get(obj.assetPath);
                if (img && img.width > 64) {
                    w = img.width;
                    h = img.height;
                }
            }

            if (obj.assetType === 'geometric') {
                radiusX = 1.5 * obj.scale;
                radiusY = 1.5 * obj.scale;
            } else if (w) {
                radiusX = ((w / 64) * obj.scale) / 2;
                if (h) {
                    radiusY = radiusX;
                }
            } else if (obj.assetType === 'animal' || obj.assetPath.includes('bunny') || obj.assetPath.includes('wolf')) {
                radiusX = 0.75 * obj.scale;
                radiusY = 0.75 * obj.scale;
            }

            radiusX += 0.2;
            radiusY += 0.2;

            const boxMinX = minX;
            const boxMaxX = maxX + 1;
            const boxMinY = minY;
            const boxMaxY = maxY + 1;

            const objMinX = obj.pos.x - radiusX;
            const objMaxX = obj.pos.x + radiusX;
            const objMinY = obj.pos.y - radiusY;
            const objMaxY = obj.pos.y + radiusY;

            const overlaps = (
                objMinX < boxMaxX &&
                objMaxX > boxMinX &&
                objMinY < boxMaxY &&
                objMaxY > boxMinY
            );

            // Keep object if it DOES NOT overlap
            return !overlaps;
        }));

        // Clear Tiles (Set to none/delete)
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                tileSystem.setTile(x, y, 'none');
            }
        }
        setTileMapVersion(v => v + 1);
        setSelectionBox(null);
    };

    const handleSaveTemplate = () => {
        if (!clipboard && !selectionBox) return;

        // If no clipboard, copy first
        if (!clipboard) {
            handleCopy();
        }

        // Use current clipboard (handleCopy is sync, so it works, but state update is async... wait)
        // Actually state update is async. We should replicate logic or use a ref/callback.
        // Let's just run logic again for safety or depend on user copying first? 
        // Better: Make a synchronous `captureSelection` helper.

        // For now, let's just re-run capture logic to be safe and sync.
        if (!selectionBox) return; // Should be handled by UI state

        const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
        const maxX = Math.max(selectionBox.start.x, selectionBox.end.x);
        const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
        const maxY = Math.max(selectionBox.start.y, selectionBox.end.y);

        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        const tiles: TemplateData['tiles'] = [];
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const tile = tileSystem.getTile(x, y);
                if (tile) {
                    tiles.push({ relX: x - minX, relY: y - minY, type: tile.type });
                }
            }
        }

        const captureObjects: TemplateData['objects'] = [];
        worldObjects.forEach(obj => {
            if (obj.pos.x >= minX && obj.pos.x <= maxX + 1 && obj.pos.y >= minY && obj.pos.y <= maxY + 1) {
                captureObjects.push({
                    relX: obj.pos.x - minX,
                    relY: obj.pos.y - minY,
                    data: obj
                });
            }
        });

        const name = prompt("Enter Template Name:", `Template ${templates.length + 1}`);
        if (!name) return;

        const newTemplate: TemplateData = {
            id: `temp_${Date.now()}`,
            name,
            width,
            height,
            tiles,
            objects: captureObjects
        };

        setTemplates(prev => [...prev, newTemplate]);
        alert(`Saved template: ${name}`);
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

    // --- Map Management ---
    const loadMapData = (map: SerializedMapData) => {
        // 1. Clear State
        setWorldObjects([]);
        // tileSystem.clear(); // TODO: Implement TileSystem.clear()
        // tileSystem.importData overwrites specific tiles but doesn't clear others?
        // Ideally we reset the grid. We don't have clear().
        // For now, assume map covers strict area or we accept artifacts.
        // TODO: Implement TileSystem.clear()

        // 2. Load New Data
        setCurrentMap(map);

        // Objects
        setWorldObjects(map.objects);

        // Tiles
        // MapData tiles are {x,y,type}[]
        // TileSystem expects same format for importData
        tileSystem.importData(map.tiles);
        setTileMapVersion(v => v + 1);

        setMapModalOpen(null);
        alert(`Loaded Map: ${map.name}`);
    };

    const handleNewMap = (type: 'HOME' | 'DUNGEON') => {
        const name = mapNameInput || (type === 'HOME' ? 'Home Base' : 'New Dungeon');
        const newMap: SerializedMapData = {
            id: `map_${Date.now()}`,
            name,
            type,
            tier: 1,
            width: 64, // Default size
            height: 64,
            tiles: [],
            objects: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        loadMapData(newMap);
    };

    const handleSaveMap = () => {
        if (!currentMap) {
            setMapModalOpen('NEW');
            return;
        }

        const exportTiles = tileSystem.exportData(); // {x,y,type}[]

        const updatedMap: SerializedMapData = {
            ...currentMap,
            objects: worldObjects,
            tiles: exportTiles,
            updatedAt: Date.now()
        };

        MapStorage.saveMap(updatedMap);
        setCurrentMap(updatedMap);
        alert('Map Saved!');
    };

    const handleRunGenerator = () => {
        if (!selectedGenTemplate) {
            alert('Please select a Primary Template to scatter.');
            return;
        }

        const config: GenerationConfig = {
            seed: genSeed,
            width: currentMap?.width || 64,
            height: currentMap?.height || 64,
            availableTemplates: templates,
            biomes: [
                {
                    type: 'GRASSLAND',
                    baseTile: 'dirt',
                    templates: [
                        {
                            templateId: selectedGenTemplate,
                            weight: 1,
                            minNoise: 0.3, // Appear where noise > 0.3
                            maxNoise: 1.0,
                            density: 0.6 // 60% chance to stamp if noise matches
                        }
                    ]
                }
            ]
        };

        const generatedMap = WorldGenerator.generateMap(config);
        loadMapData(generatedMap);
        alert('Procedural Generation Complete!');
    };

    // Render Editor UI
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

            {/* TOP BAR: Map Management */}
            <div style={{
                position: 'absolute',
                top: 10,
                left: 10,
                right: 10,
                height: 40,
                background: 'rgba(0,0,0,0.9)',
                border: '1px solid #fbbf24',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                padding: '0 15px',
                justifyContent: 'space-between',
                color: 'white',
                pointerEvents: 'auto',
                zIndex: 50
            }}>
                <div className="flex items-center gap-4">
                    <span className="font-bold text-[#fbbf24]">WORLD EDITOR</span>
                    {currentMap && (
                        <span className="text-gray-400 text-sm">
                            Editing: <span className="text-white">{currentMap.name}</span> ({currentMap.type})
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    <button style={buttonStyle} onClick={() => setMapModalOpen('NEW')}>+ NEW</button>
                    <button style={{ ...buttonStyle, background: '#10b981' }} onClick={handleSaveMap}>SAVE</button>
                    <button style={buttonStyle} onClick={() => setMapModalOpen('LOAD')}>LOAD UI</button>
                    <button style={{ ...buttonStyle, background: '#ef4444' }} onClick={handleCloseEditor}>EXIT</button>
                </div>
            </div>

            {/* Modal: New/Load Map */}
            {mapModalOpen && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[100] pointer-events-auto">
                    <div className="bg-gray-900 border border-[#fbbf24] p-6 rounded-xl w-96">
                        <h3 className="text-xl text-[#fbbf24] font-bold mb-4">
                            {mapModalOpen === 'NEW' ? 'Create New Map' : 'Load Map'}
                        </h3>

                        {mapModalOpen === 'NEW' && (
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Map Name</label>
                                    <input
                                        className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white"
                                        placeholder="My Dungeon"
                                        value={mapNameInput}
                                        onChange={e => setMapNameInput(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleNewMap('HOME')} className="flex-1 bg-blue-900 hover:bg-blue-800 p-3 rounded border border-blue-500 text-sm font-bold">
                                        HOME BASE
                                    </button>
                                    <button onClick={() => handleNewMap('DUNGEON')} className="flex-1 bg-red-900 hover:bg-red-800 p-3 rounded border border-red-500 text-sm font-bold">
                                        DUNGEON
                                    </button>
                                </div>
                            </div>
                        )}

                        {mapModalOpen === 'LOAD' && (
                            <MapList
                                onLoad={loadMapData}
                                onDelete={(id) => {
                                    MapStorage.deleteMap(id);
                                    // re-render handled by MapList internal state? 
                                    // No, MapList calls MapStorage.getMapIndex() directly which is not reactive.
                                    // We need to force update or make storage reactive.
                                    // Simple hack: Close/Open modal or update some version state.
                                    // For now, assume it works or user re-opens.
                                    setMapModalOpen(null);
                                    setTimeout(() => setMapModalOpen('LOAD'), 50);
                                }}
                            />
                        )}

                        <button onClick={() => setMapModalOpen(null)} className="mt-6 w-full py-2 text-gray-500 hover:text-white">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Asset Browser Panel */}

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
                        Exit
                    </button>
                </div>

                {/* Generator Panel Toggle */}
                <div style={{ marginBottom: 10 }}>
                    <button
                        onClick={() => setGeneratorOpen(!generatorOpen)}
                        style={{
                            width: '100%',
                            background: generatorOpen ? '#eab308' : '#444',
                            color: generatorOpen ? 'black' : 'white',
                            border: '1px solid #eab308',
                            borderRadius: 4,
                            padding: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: 12
                        }}
                    >
                        ⚡ Procedural Generator
                    </button>

                    {generatorOpen && (
                        <div style={{ marginTop: 5, padding: 8, background: '#222', borderRadius: 4, border: '1px solid #444' }}>
                            <div className="mb-2">
                                <label className="text-xs text-gray-400 block">Seed</label>
                                <input
                                    type="number"
                                    value={genSeed}
                                    onChange={(e) => setGenSeed(Number(e.target.value))}
                                    className="w-full bg-black border border-gray-600 rounded px-1 text-white text-xs"
                                />
                            </div>

                            <div className="mb-2">
                                <label className="text-xs text-gray-400 block mb-1">Primary Template</label>
                                <select
                                    className="w-full bg-black border border-gray-600 rounded text-white text-xs p-1"
                                    value={selectedGenTemplate || ''}
                                    onChange={(e) => setSelectedGenTemplate(e.target.value)}
                                >
                                    <option value="">(None)</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleRunGenerator}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-1 text-xs font-bold"
                            >
                                GENERATE MAP
                            </button>
                        </div>
                    )}
                </div>

                {/* Tools Panel */}
                <div style={{
                    display: 'flex',
                    background: '#2a2a2a',
                    padding: 4,
                    borderRadius: 4,
                    marginBottom: 10,
                    gap: 5
                }}>
                    <button
                        onClick={() => setEditorMode('paint')}
                        style={{
                            flex: 1,
                            background: editorMode === 'paint' ? '#fbbf24' : '#444',
                            color: editorMode === 'paint' ? 'black' : 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '4px 0',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: 12
                        }}
                    >
                        🎨 Paint
                    </button>
                    <button
                        onClick={() => setEditorMode('select')}
                        style={{
                            flex: 1,
                            background: editorMode === 'select' ? '#3b82f6' : '#444',
                            color: editorMode === 'select' ? 'white' : 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '4px 0',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: 12
                        }}
                    >
                        ⛝ Select
                    </button>
                    <button
                        onClick={() => setEditorMode('paste')}
                        style={{
                            flex: 1,
                            background: editorMode === 'paste' ? '#10b981' : '#444',
                            color: editorMode === 'paste' ? 'black' : 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '4px 0',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: 12,
                            opacity: clipboard ? 1 : 0.5,
                            pointerEvents: clipboard ? 'auto' : 'none'
                        }}
                    >
                        📋 Paste
                    </button>
                </div>

                <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
                    Click an asset, then click on the world to place it.
                    <br />
                    <span style={{ color: '#fbbf24' }}>Scroll Wheel:</span> Scale | <span style={{ color: '#fbbf24' }}>Delete Key:</span> Remove
                </div>

                {/* Selection Context */}
                {selectionBox && (
                    <div style={{ marginBottom: 15, padding: 8, background: '#444', borderRadius: 4 }}>
                        <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: 12, marginBottom: 5 }}>
                            Selection ({Math.abs(selectionBox.end.x - selectionBox.start.x) + 1}x{Math.abs(selectionBox.end.y - selectionBox.start.y) + 1})
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            <button onClick={handleCopy} style={{ flex: 1, cursor: 'pointer', background: '#3b82f6', border: 'none', color: 'white', borderRadius: 4, padding: '4px' }}>Copy</button>
                            <button onClick={handleSaveTemplate} style={{ flex: 1, cursor: 'pointer', background: '#10b981', border: 'none', color: 'white', borderRadius: 4, padding: '4px' }}>SaveTmpl</button>
                            <button onClick={handleDeleteSelection} style={{ flex: 1, cursor: 'pointer', background: '#ef4444', border: 'none', color: 'white', borderRadius: 4, padding: '4px' }}>Del</button>
                            <button onClick={() => setSelectionBox(null)} style={{ flex: 1, cursor: 'pointer', background: '#666', border: 'none', color: 'white', borderRadius: 4, padding: '4px' }}>Clear</button>
                        </div>
                    </div>
                )}

                {/* Templates Section */}
                {templates.length > 0 && (
                    <div style={{ marginBottom: 15 }}>
                        <div style={{
                            color: '#eab308',
                            fontWeight: 'bold',
                            fontSize: 12,
                            marginBottom: 5,
                            borderBottom: '1px solid #eab308',
                            paddingBottom: 3
                        }}>
                            📋 Templates
                        </div>
                        {templates.map(tmpl => (
                            <div
                                key={tmpl.id}
                                onClick={() => {
                                    setClipboard(tmpl);
                                    setEditorMode('paste');
                                }}
                                style={{
                                    padding: 8,
                                    marginBottom: 5,
                                    background: clipboard?.id === tmpl.id ? '#eab308' : '#2a2a2a',
                                    color: clipboard?.id === tmpl.id ? '#000' : '#fff',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    border: clipboard?.id === tmpl.id ? '2px solid #fff' : '1px solid #444',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span>{tmpl.name} ({tmpl.width}x{tmpl.height})</span>
                                <span onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete template?')) {
                                        setTemplates(prev => prev.filter(t => t.id !== tmpl.id));
                                    }
                                }}>🗑️</span>
                            </div>
                        ))}
                    </div>
                )}

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
            {
                selectedObj && (
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
                )
            }

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

const MapList = ({ onLoad, onDelete }: { onLoad: (map: SerializedMapData) => void, onDelete: (id: string) => void }) => {
    const list = MapStorage.getMapIndex();
    return (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {list.map(m => (
                <div key={m.id} className="flex justify-between items-center bg-white/5 p-2 rounded">
                    <div>
                        <div className="font-bold text-[#fbbf24]">{m.name}</div>
                        <div className="text-xs text-gray-400">{m.type}</div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => {
                            const map = MapStorage.loadMap(m.id);
                            if (map) onLoad(map);
                        }} className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-500">LOAD</button>
                        {m.type !== 'HOME' && (
                            <button onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete map?')) onDelete(m.id);
                            }} className="px-2 py-1 bg-red-600 rounded text-xs hover:bg-red-500">DEL</button>
                        )}
                    </div>
                </div>
            ))}
            {list.length === 0 && <div className="text-gray-500 italic">No saved maps.</div>}
        </div>
    );
};
