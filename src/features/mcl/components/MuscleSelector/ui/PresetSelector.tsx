import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, ChevronDown, Check } from 'lucide-react';
import { presets, WorkoutPreset } from '../../../data/presets';

interface PresetSelectorProps {
    onPresetSelect: (muscleIds: string[], presetId: string) => void;
    currentSelection: string[];
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
    onPresetSelect,
    currentSelection,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handlePresetClick = useCallback(
        (preset: WorkoutPreset) => {
            onPresetSelect(preset.muscleIds, preset.id);
            setIsOpen(false);
        },
        [onPresetSelect]
    );

    // Check if current selection matches a preset
    const activePreset = presets.find((preset) => {
        if (currentSelection.length !== preset.muscleIds.length) return false;
        return preset.muscleIds.every((id) => currentSelection.includes(id));
    });

    const getCategoryColor = (category: WorkoutPreset['category']) => {
        const base = "backdrop-blur-sm border shadow-[0_0_8px_-2px]";
        switch (category) {
            case 'push':
                return `${base} bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/30`;
            case 'pull':
                return `${base} bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/30`;
            case 'legs':
                return `${base} bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/30`;
            case 'upper':
                return `${base} bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/30`;
            case 'lower':
                return `${base} bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-pink-500/30`;
            case 'fullbody':
                return `${base} bg-green-500/10 text-green-400 border-green-500/20 shadow-green-500/30`;
            default:
                return `${base} bg-gray-500/10 text-gray-400 border-gray-500/20 shadow-gray-500/30`;
        }
    };

    return (
        <div className="relative">
            {/* Trigger button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 border
          ${activePreset
                        ? 'bg-primary/20 text-primary-300 border-primary/30 shadow-[0_0_15px_-5px_rgba(168,85,247,0.3)]'
                        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                    }
        `}
            >
                <Dumbbell className="w-4 h-4" />
                <span className="text-sm font-medium">
                    {activePreset ? activePreset.name : 'Presets'}
                </span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu - Glassmorphism */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                            className="absolute top-full left-0 mt-2 w-72 bg-[#0f0518]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5),0_0_15px_-5px_rgba(168,85,247,0.2)] overflow-hidden z-50 max-h-[450px] overflow-y-auto custom-scrollbar ring-1 ring-white/5"
                        >
                            <div className="p-2 space-y-1">
                                <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                    Quick Select
                                </div>
                                {presets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => handlePresetClick(preset)}
                                        className={`
                                            group w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300
                                            border-l-2 text-left relative overflow-hidden
                                            ${activePreset?.id === preset.id
                                                ? 'bg-white/5 border-primary shadow-[inset_0_0_20px_-10px_rgba(168,85,247,0.2)]'
                                                : 'border-transparent hover:bg-white/5 hover:border-white/20'
                                            }
                                        `}
                                    >
                                        <div className="flex-1 relative z-10">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-medium transition-colors ${activePreset?.id === preset.id ? 'text-primary-300' : 'text-gray-200 group-hover:text-white'
                                                    }`}>
                                                    {preset.name}
                                                </span>
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${getCategoryColor(
                                                        preset.category
                                                    )}`}
                                                >
                                                    {preset.category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
                                                {preset.description}
                                            </p>
                                        </div>
                                        {activePreset?.id === preset.id && (
                                            <motion.div
                                                layoutId="active-check"
                                                className="text-primary-400 relative z-10"
                                            >
                                                <Check className="w-4 h-4 shadow-[0_0_10px_currentColor]" />
                                            </motion.div>
                                        )}

                                        {/* Hover Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PresetSelector;
