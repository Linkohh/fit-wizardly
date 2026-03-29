import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { SelectedMusclesSheet } from './ui/SelectedMusclesSheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppleMobile } from '@/hooks/use-apple-mobile';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { useInteractionFeedback } from '@/hooks/useInteractionFeedback';
import { getTimedTransition } from '@/lib/motion/tokens';

export const MuscleSelector: React.FC<MuscleSelectorProps> = ({
  selectedMuscles: controlledSelection,
  onSelectionChange,
  multiSelect = true,
  defaultView = 'front',
  showSideView = true,
  showHeader = true,
  showSearch = true,
  showLegend = true,
  showTooltip = true,
  showInfoPanel = true,
  showSelectionSidebar = true,
  showPresets = true,
  headerControlsMode = 'full',
  colorByGroup: initialColorByGroup = true,
  theme: themeProp = 'system',
  accentColor = '#EF4444',
  hoverIntensity = 'default',
  onMuscleHover,
  onMuscleClick,
  onInfoRequest,
  onViewChange,
  onPresetApply,
  highlightedMuscles,
  disabledMuscles,
  animateHighlights = false,
  width = '100%',
  height = '100%',
  className = '',
  customViewBox,
}) => {
  const isMobile = useIsMobile();
  const isAppleMobile = useAppleMobile();
  const isTouchContext = isMobile;
  const { shouldReduceMotion } = useMotionPreferences();
  const { emit } = useInteractionFeedback();
  const shouldUseAppleSheet = showSelectionSidebar && isMobile && isAppleMobile;
  const shouldUseAppleHaptics = isMobile && isAppleMobile;
  const showInlineMobileSidebar = showSelectionSidebar && isMobile && !isAppleMobile;
  const showDesktopSidebar = showSelectionSidebar && !isMobile;
  const isEmbeddedHeader = headerControlsMode === 'embedded';
  const showAppearanceControls = !isEmbeddedHeader;

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Theme
  const { resolvedTheme, toggleTheme, themeClassName } = useTheme(themeProp);

  // View state
  const [currentView, setCurrentView] = useState<ViewType>(defaultView);

  // Sync view when defaultView prop changes (for controlled usage)
  useEffect(() => {
    setCurrentView(defaultView);
  }, [defaultView]);

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
  const [isSelectionSheetOpen, setIsSelectionSheetOpen] = useState(false);
  const [selectionSheetSnap, setSelectionSheetSnap] = useState<number | string | null>(0.22);

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
      const wasSelected = selectedIds.includes(muscle.id);
      toggleMuscle(muscle.id);
      onMuscleClick?.(muscle);
      void emit(wasSelected ? 'deselect' : 'select');
    },
    [selectedIds, toggleMuscle, onMuscleClick, emit]
  );

  const handleMuscleLongPress = useCallback(
    (muscle: Muscle) => {
      setInfoPanel({ isOpen: true, muscle });
      onInfoRequest?.(muscle);
      void emit('longPressInfo');

      // Switch to a view where this muscle is visible
      if (!muscle.views.includes(currentView) && muscle.views.length > 0) {
        setCurrentView(muscle.views[0]);
      }
    },
    [onInfoRequest, emit, currentView]
  );

  const handleCloseInfo = useCallback(() => {
    setInfoPanel({ isOpen: false, muscle: null });
  }, []);

  const handleInfoMuscleClick = useCallback(
    (muscleId: string) => {
      const muscle = getMuscleById(muscleId);
      if (muscle) {
        selectMuscle(muscleId);
        void emit('select');
        setInfoPanel({ isOpen: true, muscle });
        // Switch to a view where this muscle is visible
        if (!muscle.views.includes(currentView) && muscle.views.length > 0) {
          setCurrentView(muscle.views[0]);
        }
      }
    },
    [selectMuscle, currentView, emit]
  );

  const handleSearchSelect = useCallback(
    (muscle: Muscle) => {
      selectMuscle(muscle.id);
      void emit('select');
      // Switch to a view where this muscle is visible
      if (!muscle.views.includes(currentView) && muscle.views.length > 0) {
        setCurrentView(muscle.views[0]);
      }
    },
    [selectMuscle, currentView, emit]
  );

  const handleRemoveMuscle = useCallback(
    (muscleId: string) => {
      deselectMuscle(muscleId);
      void emit('deselect');
    },
    [deselectMuscle, emit]
  );

  const handleViewMuscleInfo = useCallback((muscle: Muscle) => {
    setInfoPanel({ isOpen: true, muscle });
    onInfoRequest?.(muscle);
  }, [onInfoRequest]);

  const handleOpenSelectionSheet = useCallback(() => {
    setSelectionSheetSnap(0.22);
    if (shouldUseAppleHaptics) {
      void emit('sheetOpen');
    }
  }, [emit, shouldUseAppleHaptics]);

  const handleSelectionSheetSnap = useCallback(() => {
    if (shouldUseAppleHaptics) {
      void emit('sheetSnap');
    }
  }, [emit, shouldUseAppleHaptics]);

  return (
    <div
      ref={containerRef}
      data-testid="muscle-selector-root"
      className={`relative flex flex-col md:flex-row ${(className || '').includes('bg-transparent') ? '' : 'surface-premium surface-premium-stroke'} ${themeClassName} ${className || ''}`}
      style={{ width, height }}
    >
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0" data-testid="muscle-selector-main">
        {/* Header / Controls */}
        {showHeader && (
          <div className="flex items-center justify-between gap-3 p-3 sm:p-4 border-b border-border/30 dark:border-white/10 overflow-hidden">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              {/* View Switcher */}
              <div className="shrink-0">
                <ViewSwitcher
                  currentView={currentView}
                  showSideView={showSideView}
                  onViewChange={handleViewChange}
                />
              </div>

              {/* Search */}
              {showSearch && (
                <div className="hidden min-w-0 flex-1 md:block md:max-w-[13rem] lg:max-w-[16rem] transition-all duration-300">
                  <SearchBar
                    onMuscleSelect={handleSearchSelect}
                    onMuscleHover={(m) => setHoveredMuscle(m?.id || null)}
                  />
                </div>
              )}
            </div>

            {!isMobile && (
              <div className="flex flex-shrink-0 items-center gap-2">
                {/* Undo/Redo */}
                <div className="ml-1 flex flex-shrink-0 items-center gap-2 border-l border-border/30 dark:border-white/10 pl-2">
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${canUndo
                        ? 'bg-muted/30 dark:bg-white/5 text-foreground hover:bg-muted/50 dark:hover:bg-white/10'
                        : 'bg-muted/30 dark:bg-white/5 text-foreground/20 cursor-not-allowed'
                      }
                    `}
                    title="Undo (Ctrl+Z)"
                    aria-label="Undo"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${canRedo
                        ? 'bg-muted/30 dark:bg-white/5 text-foreground hover:bg-muted/50 dark:hover:bg-white/10'
                        : 'bg-muted/30 dark:bg-white/5 text-foreground/20 cursor-not-allowed'
                      }
                    `}
                    title="Redo (Ctrl+Shift+Z)"
                    aria-label="Redo"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>

                {showAppearanceControls ? (
                  <>
                    {/* Color mode toggle */}
                    <button
                      onClick={() => setColorByGroup(!colorByGroup)}
                      className={`
                        p-2 rounded-lg transition-colors
                        ${colorByGroup
                          ? 'bg-primary/20 text-primary-300 ring-1 ring-primary/50'
                          : 'bg-muted/30 dark:bg-white/5 text-muted-foreground hover:bg-muted/50 dark:hover:bg-white/10 hover:text-foreground'
                        }
                      `}
                      title={colorByGroup ? 'Disable color by group' : 'Enable color by group'}
                      aria-label="Toggle color by group"
                    >
                      <Palette className="w-4 h-4" />
                    </button>

                    {/* Theme toggle */}
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-lg bg-muted/30 dark:bg-white/5 text-muted-foreground hover:bg-muted/50 dark:hover:bg-white/10 hover:text-foreground transition-colors"
                      title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                      aria-label="Toggle selector theme"
                    >
                      {resolvedTheme === 'dark' ? (
                        <Sun className="w-4 h-4" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )}
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        {showLegend && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <Legend />
          </div>
        )}

        {/* SVG Canvas Area */}
        <div className="flex-1 relative overflow-hidden p-2 sm:p-4" data-testid="muscle-selector-canvas-area">
          <motion.div
            className="w-full h-full flex items-center justify-center"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={getTimedTransition('base', shouldReduceMotion)}
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
                animateHighlights={!shouldReduceMotion && animateHighlights}
                hoverIntensity={hoverIntensity}
                enableTouchInfo={isAppleMobile && isMobile}
                longPressMs={380}
                reduceMotion={shouldReduceMotion}
                onMuscleHover={handleMuscleHover}
                onMuscleClick={handleMuscleClick}
                onMuscleLongPress={handleMuscleLongPress}
                customViewBox={customViewBox}
              />
            </div>
          </motion.div>

          {/* Tooltip */}
          {showTooltip && !isTouchContext && (
            <MuscleTooltip
              muscle={tooltip.muscle}
              position={{ x: tooltip.x, y: tooltip.y }}
              visible={tooltip.visible}
              containerRef={containerRef as React.RefObject<HTMLDivElement>}
            />
          )}
        </div>
      </div>

      {/* Selection Sidebar (Desktop) */}
      {showDesktopSidebar && (
        <div className="w-full md:w-72 md:flex-shrink-0 min-h-0" data-testid="muscle-selector-sidebar">
          <SelectionSidebar
            selectedMuscles={selectedMuscles}
            onRemoveMuscle={handleRemoveMuscle}
            onClearAll={clearSelection}
            onViewInfo={handleViewMuscleInfo}
            showPresets={showPresets}
            reduceMotion={shouldReduceMotion}
            onPresetSelect={(muscleIds, presetId) => {
              setSelection(muscleIds);
              onPresetApply?.(presetId, muscleIds);
            }}
            currentSelectionIds={selectedIds}
          />
        </div>
      )}

      {/* Selection Sidebar (Android + non-Apple mobile) */}
      {showInlineMobileSidebar && (
        <div className="w-full min-h-0" data-testid="muscle-selector-sidebar">
          <SelectionSidebar
            selectedMuscles={selectedMuscles}
            onRemoveMuscle={handleRemoveMuscle}
            onClearAll={clearSelection}
            onViewInfo={handleViewMuscleInfo}
            showPresets={showPresets}
            reduceMotion={shouldReduceMotion}
            onPresetSelect={(muscleIds, presetId) => {
              setSelection(muscleIds);
              onPresetApply?.(presetId, muscleIds);
            }}
            currentSelectionIds={selectedIds}
          />
        </div>
      )}

      {/* Selection Sheet (Apple mobile only) */}
      {shouldUseAppleSheet && (
        <SelectedMusclesSheet
          open={isSelectionSheetOpen}
          selectedCount={selectedMuscles.length}
          activeSnapPoint={selectionSheetSnap}
          onOpenChange={setIsSelectionSheetOpen}
          onActiveSnapPointChange={setSelectionSheetSnap}
          onTriggerOpen={handleOpenSelectionSheet}
          onSnapPointChange={handleSelectionSheetSnap}
        >
          <SelectionSidebar
            mobileSheetMode
            selectedMuscles={selectedMuscles}
            onRemoveMuscle={handleRemoveMuscle}
            onClearAll={clearSelection}
            onViewInfo={handleViewMuscleInfo}
            showPresets={showPresets}
            reduceMotion={shouldReduceMotion}
            onPresetSelect={(muscleIds, presetId) => {
              setSelection(muscleIds);
              onPresetApply?.(presetId, muscleIds);
            }}
            currentSelectionIds={selectedIds}
          />
        </SelectedMusclesSheet>
      )}

      {/* Info Panel (overlay) */}
      {showInfoPanel && (
        <InfoPanel
          muscle={infoPanel.muscle}
          isOpen={infoPanel.isOpen}
          reduceMotion={shouldReduceMotion}
          onClose={handleCloseInfo}
          onMuscleClick={handleInfoMuscleClick}
        />
      )}
    </div>
  );
};

export default MuscleSelector;
