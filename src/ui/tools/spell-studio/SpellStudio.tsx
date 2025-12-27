import React, { useState, useEffect } from 'react';
import { SPELL_REGISTRY } from '../../../modules/spells/SpellRegistry';
import { ANIMATION_LIBRARY } from '../../../data/AnimationData';
import { DEFAULT_SPELL } from '../../../components/spell-studio/constants';

// New UI Layer
import { LibraryPanel } from './panels/LibraryPanel';
import { TimelinePanel } from './panels/TimelinePanel';
import { InspectorPanel } from './panels/InspectorPanel';
import { CanvasPanel } from './panels/CanvasPanel';

// Hooks
import { useSpellLoop } from '../../../hooks/useSpellLoop';
import { useSpellStudio } from '../../../hooks/useSpellStudio';

interface SpellStudioProps {
    onBack: () => void;
}

export const SpellStudio: React.FC<SpellStudioProps> = ({ onBack }) => {
    // 1. Antigravity State Management
    const { session, engine, controller } = useSpellStudio(DEFAULT_SPELL);

    // 2. Animation Loop (Hybrid - partly managed by hook, synced to engine)
    const {
        uiProgress,
        isPlaying,
        play,
        pause,
        setFrameMs,
        cast
    } = useSpellLoop(session.spell, (_projectiles) => {
        // We ignore the hook's projectile logic in favor of the engine's physics
    });

    // Sync UI loop state to engine
    useEffect(() => {
        engine.setProgress(uiProgress);
    }, [uiProgress, engine]);

    // 3. UI State
    const [activeTab, setActiveTab] = useState('PROPERTIES');
    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [libraryMode, setLibraryMode] = useState<'ANIMATIONS' | 'SPELLS'>('SPELLS');

    const handleCast = () => {
        cast();
    };

    const handleSelectSpell = (spellKey: string) => {
        const spell = SPELL_REGISTRY[spellKey];
        if (spell) {
            controller.updateSpell(spell);
        }
    };

    const handleSaveAnimationLibrary = async () => {
        try {
            const res = await fetch('/save-animations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ANIMATION_LIBRARY)
            });
            if (res.ok) alert('Animation Library Saved!');
            else alert('Failed to save animations.');
        } catch (e) {
            console.error(e);
            alert('Error saving animations.');
        }
    };

    return (
        <div className="flex w-full h-full bg-[#18181b] overflow-hidden text-zinc-300 font-sans">
            {/* LEFT PANEL: LIBRARY */}
            <LibraryPanel
                collapsed={leftPanelCollapsed}
                setCollapsed={setLeftPanelCollapsed}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}

                mode={libraryMode}
                onModeChange={setLibraryMode}

                animations={ANIMATION_LIBRARY}
                selectedAnim={session.timeline.selectedAnim}
                onSelectAnim={(anim) => controller.setSelectedAnim(anim)}

                spells={SPELL_REGISTRY}
                selectedSpellId={session.spell.id}
                onSelectSpell={handleSelectSpell}

                onBack={onBack}
                onSave={handleSaveAnimationLibrary}
            />

            {/* CENTER: CANVAS & TIMELINE */}
            <div className="flex-1 flex flex-col relative min-w-0">
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    <CanvasPanel
                        engine={engine}
                        session={session}
                        controller={controller}
                        activeTab={activeTab}
                    />
                </div>

                <TimelinePanel
                    session={session}
                    controller={controller}
                    selectedAnim={session.timeline.selectedAnim}
                    uiProgress={uiProgress}
                    isPlaying={isPlaying}
                    onPlay={play}
                    onPause={pause}
                    onSeek={setFrameMs}
                    onCast={handleCast}
                />
            </div>

            {/* RIGHT PANEL: INSPECTOR */}
            <div className="w-80 border-l border-[#3f3f46] bg-[#18181b] flex flex-col">
                <InspectorPanel
                    session={session}
                    controller={controller}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    selectedAnim={session.timeline.selectedAnim}
                />
            </div>
        </div>
    );
};
