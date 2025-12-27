import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { preloadGameAssets } from './utils/AssetLoader';
import { HUD } from './components/hud/HUD';
import { MainMenu } from './components/MainMenu';
import { Player, SpellType, EquipmentItem, SpellElement, ShopItem, EquipmentSlot } from './types';
import { QUEST_CONFIG, SHOP_RESET_DURATION } from './constants';
import { createInitialPlayer } from './utils/factory';
import { saveCharacter } from './utils/storage';

export type GameActions = {
  upgradeTalent: (spellId: string, talentId: string) => void;
  upgradeBaseStat: (stat: 'vitality' | 'power' | 'haste' | 'swiftness') => void;
  usePotion: (type: 'health' | 'mana' | 'speed') => void;
  equipItem: (item: EquipmentItem) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  buyShopItem: (item: ShopItem) => void;
  assignHotbarSlot: (index: number, spell: SpellType | null) => void;
  castSpell: (spell: SpellType) => void;
  selectSpell: (spell: SpellType) => void;
  toggleMount: () => void;
  unlockSpell: (spell: SpellType) => void;
  equipCard: (spell: SpellType, card: import('./modules/cards/types').CardInstance) => void;
  unequipCard: (spell: SpellType, cardInstanceId: string) => void;
  injectDust: (spell: SpellType, amount: number) => void;
  upgradeSpell: (spell: SpellType) => void;
};

function App() {
  const [playerState, setPlayerState] = useState<Player>(createInitialPlayer());
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shopResetTimer, setShopResetTimer] = useState(SHOP_RESET_DURATION);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameId, setGameId] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Quest State
  const [activeQuest, setActiveQuest] = useState({
    id: 'quest_1',
    description: `Kill ${QUEST_CONFIG.baseKillTarget} Enemies`,
    type: 'kill' as const,
    target: QUEST_CONFIG.baseKillTarget,
    current: 0,
    rewardXp: QUEST_CONFIG.baseRewardXp,
    rewardCoins: QUEST_CONFIG.baseRewardCoins
  });

  const gameActionsRef = useRef<GameActions>({
    upgradeTalent: () => { },
    upgradeBaseStat: () => { },
    usePotion: () => { },
    equipItem: () => { },
    unequipItem: () => { },
    buyShopItem: () => { },
    assignHotbarSlot: () => { },
    castSpell: () => { },
    selectSpell: () => { },
    toggleMount: () => { },
    unlockSpell: () => { },
    equipCard: () => { },
    unequipCard: () => { },
    injectDust: () => { },
    upgradeSpell: () => { }
  });

  // ...

  useEffect(() => {
    preloadGameAssets();
  }, []);

  const handleSelectSpell = (spell: SpellType) => {
    gameActionsRef.current.selectSpell(spell);
  };


  const [minimapData, setMinimapData] = useState<any>({ items: [] });

  const handleUiUpdate = useCallback((player: Player, score: number, isGameOver: boolean, currentQuest: any, currentShopItems: ShopItem[], currentShopTimer: number, mData: any) => {
    setPlayerState({ ...player });
    setScore(score);
    setGameOver(isGameOver);
    if (currentQuest) setActiveQuest(currentQuest);
    setShopItems(currentShopItems);
    setShopResetTimer(currentShopTimer);
    if (mData) setMinimapData(mData);
  }, []);



  const handleRestart = () => {
    setGameOver(false);
    setScore(0);
    // Restarting re-uses current character reference but factory creates fresh state
    // We should probably keep the NAME/ID but reset stats? 
    // Usually ARPGs are permadeath or respawn. 
    // The previous implementation did a full reset. 
    // Let's create a fresh player with same name/id for "Resurrect" if we want to keep it simple,
    // OR just reset HP and move to town.
    // For now, full reset to be safe with existing logic.
    setPlayerState(createInitialPlayer({ name: playerState.name, id: playerState.id, visuals: playerState.visuals }));
    setGameId(prev => prev + 1);
    setIsPaused(false);
  };

  const handleQuit = () => {
    try {
      saveCharacter(playerState);
    } catch (e) {
      console.error("Failed to save character:", e);
    }
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setGameId(prev => prev + 1); // Ensure fresh canvas/game instance on next start
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleInjectDust = (spell: SpellType, amount: number) => {
    gameActionsRef.current.injectDust(spell, amount);
  };

  const handleUpgradeSpell = (spell: SpellType) => {
    gameActionsRef.current.upgradeSpell(spell);
  };

  const handleUpgradeTalent = (spellId: string, talentId: string) => {
    gameActionsRef.current.upgradeTalent(spellId, talentId);
  };

  const handleUpgradeBaseStat = (stat: 'vitality' | 'power' | 'haste' | 'swiftness') => {
    gameActionsRef.current.upgradeBaseStat(stat);
  };

  const handleUsePotion = (type: 'health' | 'mana' | 'speed') => {
    if (!isPaused) {
      gameActionsRef.current.usePotion(type);
    }
  };

  const handleEquip = (item: EquipmentItem) => {
    gameActionsRef.current.equipItem(item);
  }

  const handleUnequip = (slot: EquipmentSlot) => {
    gameActionsRef.current.unequipItem(slot);
  }

  const handleBuyItem = (item: ShopItem) => {
    gameActionsRef.current.buyShopItem(item);
  }

  const handleAssignHotbarSlot = (index: number, spell: SpellType | null) => {
    gameActionsRef.current.assignHotbarSlot(index, spell);
  }

  const handleCastSpell = (spell: SpellType) => {
    if (!isPaused && gameStarted) {
      gameActionsRef.current.castSpell(spell);
    }
  }

  const handleToggleMount = () => {
    if (!isPaused && gameStarted) {
      gameActionsRef.current.toggleMount();
    }
  }

  const handleStartGame = (player: Player) => {
    setPlayerState(player);
    setGameStarted(true);
  };

  const handleEquipCard = (spell: SpellType, card: import('./modules/cards/types').CardInstance) => {
    gameActionsRef.current.equipCard(spell, card);
  };

  const handleUnequipCard = (spell: SpellType, cardId: string) => {
    gameActionsRef.current.unequipCard(spell, cardId);
  };

  // Global Pause/Escape Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key.toLowerCase() === 'p' || e.key === 'Escape') && !gameOver && gameStarted) {
        // Note: If HUD captures Escape to close windows, this might not fire due to stopImmediatePropagation, which is intended.
        setIsPaused(prev => !prev);
      }
      if (e.key.toLowerCase() === 'o' && !gameOver && gameStarted && !isPaused) {
        handleToggleMount();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, gameStarted]);

  const playerStateRef = useRef(playerState);
  useEffect(() => { playerStateRef.current = playerState; }, [playerState]);

  // Auto-Save Loop (Every 5 seconds)
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const intervalId = setInterval(() => {
      // Save current player state to local storage using Ref to avoid clearing interval
      if (playerStateRef.current) {
        saveCharacter(playerStateRef.current);
        console.log('[AutoSave] Character Saved');
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [gameStarted, gameOver]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-900 select-none font-sans">
      {!gameStarted && <MainMenu onStartGame={handleStartGame} />}

      {gameStarted && (
        <>
          <GameCanvas
            key={gameId}
            onUiUpdate={handleUiUpdate}
            gameActionsRef={gameActionsRef}
            isPaused={isPaused}
            gameStarted={gameStarted}
            onStartGame={handleStartGame}
            initialPlayer={playerState}
          />
          <HUD
            player={playerState}
            score={score}
            gameOver={gameOver}
            onRestart={handleRestart}
            onResume={handleResume}
            onQuit={handleQuit}
            onUpgradeTalent={handleUpgradeTalent}
            onUpgradeBaseStat={handleUpgradeBaseStat}
            onUsePotion={handleUsePotion}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
            onBuyItem={handleBuyItem}
            onAssignHotbarSlot={handleAssignHotbarSlot}
            onCastSpell={handleCastSpell}
            onSelectSpell={handleSelectSpell}
            onToggleMount={handleToggleMount}
            onUnlockSpell={(spell) => gameActionsRef.current.unlockSpell(spell)}
            onUpgradeSpell={handleUpgradeSpell}
            onInjectDust={handleInjectDust}
            isPaused={isPaused}
            activeQuest={activeQuest}
            shopItems={shopItems}
            shopResetTimer={shopResetTimer}
            gameStarted={gameStarted}
            minimapData={minimapData}
          />
        </>
      )}

      <div className="absolute top-2 right-2 text-white/20 text-xs pointer-events-none md:hidden">
        Desktop recommended (Mouse/Keyboard)
      </div>
    </div>
  );
}

export default App;