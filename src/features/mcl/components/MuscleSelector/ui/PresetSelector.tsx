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
        switch (category) {
            case 'push':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            case 'pull':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'legs':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'upper':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
            case 'lower':
                return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300';
            case 'fullbody':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="relative">
            {/* Trigger button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
          ${activePreset
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
        `}
            >
                <Dumbbell className="w-4 h-4" />
                <span className="text-sm font-medium">
                    {activePreset ? activePreset.name : 'Presets'}
                </span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
                            className="absolute top-full left-0 mt-2 w-72 glass-panel-stronger rounded-xl shadow-premium-lg border border-white/10 overflow-hidden z-50"
                        >
                            <div className="p-2">
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Quick Select
                                </div>
                                {presets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => handlePresetClick(preset)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {preset.name}
                                                </span>
                                                <span
                                                    className={`text-xs px-1.5 py-0.5 rounded ${getCategoryColor(
                                                        preset.category
                                                    )}`}
                                                >
                                                    {preset.category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {preset.description}
                                            </p>
                                        </div>
                                        {activePreset?.id === preset.id && (
                                            <Check className="w-4 h-4 text-primary-500" />
                                        )}
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
