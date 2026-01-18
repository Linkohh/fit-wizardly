import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Palette, Undo2, Redo2 } from 'lucide-react';
import { MuscleSelectorProps, ViewType, Muscle, TooltipState, InfoPanelState } from '../../types';
import { getMuscleById } from '../../data/muscles';
import { useMuscleSelection } from '../../hooks/useMuscleSelection';
import { useTheme } from '../../hooks/useTheme';
import MuscleCanvas from './svg/MuscleCanvas';
import ViewSwitcher from './ui/ViewSwitcher';
import MuscleTooltip from './ui/MuscleTooltip';
import InfoPanel from './ui/InfoPanel';
import SelectionSidebar from './ui/SelectionSidebar';
import Legend from './ui/Legend';
import SearchBar from './ui/SearchBar';
import PresetSelector from './ui/PresetSelector';

export const MuscleSelector: React.FC<MuscleSelectorProps> = ({
  selectedMuscles: controlledSelection,
  onSelectionChange,
  multiSelect = true,
  defaultView = 'front',
  showSideView = true,
  showSearch = true,
  showLegend = true,
  showInfoPanel = true,
  showSelectionSidebar = true,
  colorByGroup: initialColorByGroup = true,
  theme: themeProp = 'system',
  accentColor = '#EF4444',
  onMuscleHover,
  onMuscleClick,
  onInfoRequest,
  onViewChange,
  onPresetApply,
  highlightedMuscles,
  disabledMuscles,
  width = '100%',
  height = '100%',
  className = '',
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Theme
  const { resolvedTheme, toggleTheme } = useTheme(themeProp);

  // View state
  const [currentView, setCurrentView] = useState<ViewType>(defaultView);

  // Color mode
  const [colorByGroup, setColorByGroup] = useState(initialColorByGroup);

  // Selection (controlled or uncontrolled)
  const {
    selectedIds,
    selectedMuscles,
    toggleMuscle,
    selectMuscle,
    deselectMuscle,
    clearSelection,
    setSelection,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMuscleSelection({
    initialSelection: controlledSelection || [],
    multiSelect,
    onChange: onSelectionChange,
  });

  // Tooltip state
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    muscle: null,
  });

  // Info panel state
  const [infoPanel, setInfoPanel] = useState<InfoPanelState>({
    isOpen: false,
    muscle: null,
  });

  // Hover state for highlighting
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  // Handlers
  const handleViewChange = useCallback(
    (view: ViewType) => {
      setCurrentView(view);
      onViewChange?.(view);
    },
    [onViewChange]
  );

  const handleMuscleHover = useCallback(
    (muscle: Muscle | null, event?: React.MouseEvent) => {
      if (muscle && event && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          muscle,
        });
        setHoveredMuscle(muscle.id);
      } else {
        setTooltip((prev) => ({ ...prev, visible: false }));
        setHoveredMuscle(null);
      }
      onMuscleHover?.(muscle);
    },
    [onMuscleHover]
  );

  const handleMuscleClick = useCallback(
    (muscle: Muscle) => {
      toggleMuscle(muscle.id);
      onMuscleClick?.(muscle);
    },
    [toggleMuscle, onMuscleClick]
  );

  const handleCloseInfo = useCallback(() => {
    setInfoPanel({ isOpen: false, muscle: null });
  }, []);

  const handleInfoMuscleClick = useCallback(
    (muscleId: string) => {
      const muscle = getMuscleById(muscleId);
      if (muscle) {
        selectMuscle(muscleId);
        setInfoPanel({ isOpen: true, muscle });
        // Switch to a view where this muscle is visible
        if (!muscle.views.includes(currentView) && muscle.views.length > 0) {
          setCurrentView(muscle.views[0]);
        }
      }
    },
    [selectMuscle, currentView]
  );

  const handleSearchSelect = useCallback(
    (muscle: Muscle) => {
      selectMuscle(muscle.id);
      // Switch to a view where this muscle is visible
      if (!muscle.views.includes(currentView) && muscle.views.length > 0) {
        setCurrentView(muscle.views[0]);
      }
    },
    [selectMuscle, currentView]
  );

  const handleRemoveMuscle = useCallback(
    (muscleId: string) => {
      deselectMuscle(muscleId);
    },
    [deselectMuscle]
  );

  const handleViewMuscleInfo = useCallback((muscle: Muscle) => {
    setInfoPanel({ isOpen: true, muscle });
    onInfoRequest?.(muscle);
  }, [onInfoRequest]);

  return (
    <div
      ref={containerRef}
      className={`relative flex bg-white dark:bg-gray-950 ${className}`}
      style={{ width, height }}
    >
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header / Controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            {/* View Switcher */}
            <ViewSwitcher
              currentView={currentView}
              showSideView={showSideView}
              onViewChange={handleViewChange}
            />

            {/* Search */}
            {showSearch && (
              <div className="w-64">
                <SearchBar
                  onMuscleSelect={handleSearchSelect}
                  onMuscleHover={(m) => setHoveredMuscle(m?.id || null)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Preset Selector */}
            <PresetSelector
              onPresetSelect={(muscleIds, presetId) => {
                setSelection(muscleIds);
                onPresetApply?.(presetId, muscleIds);
              }}
              currentSelection={selectedIds}
            />

            {/* Undo/Redo */}
            <div className="flex items-center border-l border-gray-200 dark:border-gray-700 pl-2 ml-2">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={`
                  p-2 rounded-lg transition-colors
                  ${canUndo
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }
                `}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className={`
                  p-2 rounded-lg transition-colors
                  ${canRedo
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }
                `}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Color mode toggle */}
            <button
              onClick={() => setColorByGroup(!colorByGroup)}
              className={`
                p-2 rounded-lg transition-colors
                ${colorByGroup
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }
              `}
              title={colorByGroup ? 'Disable color by group' : 'Enable color by group'}
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <Legend />
          </div>
        )}

        {/* SVG Canvas Area */}
        <div className="flex-1 relative overflow-hidden p-4">
          <motion.div
            className="w-full h-full flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-full h-full max-w-lg">
              <MuscleCanvas
                view={currentView}
                selectedMuscles={selectedIds}
                hoveredMuscle={hoveredMuscle}
                highlightedMuscles={highlightedMuscles}
                disabledMuscles={disabledMuscles}
                colorByGroup={colorByGroup}
                accentColor={accentColor}
                onMuscleHover={handleMuscleHover}
                onMuscleClick={handleMuscleClick}
              />
            </div>
          </motion.div>

          {/* Tooltip */}
          <MuscleTooltip
            muscle={tooltip.muscle}
            position={{ x: tooltip.x, y: tooltip.y }}
            visible={tooltip.visible}
            containerRef={containerRef as React.RefObject<HTMLDivElement>}
          />
        </div>
      </div>

      {/* Selection Sidebar */}
      {showSelectionSidebar && (
        <div className="w-72 flex-shrink-0">
          <SelectionSidebar
            selectedMuscles={selectedMuscles}
            onRemoveMuscle={handleRemoveMuscle}
            onClearAll={clearSelection}
            onViewInfo={handleViewMuscleInfo}
          />
        </div>
      )}

      {/* Info Panel (overlay) */}
      {showInfoPanel && (
        <InfoPanel
          muscle={infoPanel.muscle}
          isOpen={infoPanel.isOpen}
          onClose={handleCloseInfo}
          onMuscleClick={handleInfoMuscleClick}
        />
      )}
    </div>
  );
};

export default MuscleSelector;
