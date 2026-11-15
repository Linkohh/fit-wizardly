import React from 'react';
import { X } from 'lucide-react';
import type { AnatomyMember, AnatomyResult } from '../../../lib/anatomyEngine';
import { getMemberVisibility, type ViewAndLayer } from '../../../lib/anatomyFocus';

interface AnatomyResultListProps {
  result: AnatomyResult;
  title: string;
  current: ViewAndLayer;
  selectedIds: string[];
  onSelectMember: (member: AnatomyMember) => void;
  /** Omitted in single-select mode, where selecting every match at once is not allowed. */
  onSelectAll?: () => void;
  onClear: () => void;
}

function describeMember(member: AnatomyMember, current: ViewAndLayer): string | null {
  const visibility = getMemberVisibility(member, current);
  if (visibility.kind === 'not-drawn') return 'not drawn yet';
  if (visibility.kind === 'other-view') return `on ${visibility.view} view`;
  if (visibility.kind === 'other-layer') return `${visibility.layer} layer`;
  return member.shownAs ? `shown as ${member.shownAs.name}` : null;
}

/**
 * The muscles matched by a search or a region chip. Matches are lit up on the
 * body; tapping a name (or Select all) adds it to the selection.
 */
export const AnatomyResultList: React.FC<AnatomyResultListProps> = ({
  result,
  title,
  current,
  selectedIds,
  onSelectMember,
  onSelectAll,
  onClear,
}) => {
  // Group headings (Calves, Back) have no shape of their own; list the muscles inside them.
  const groupIds = new Set(result.members.map((member) => member.node.parent));
  const listed = result.members.filter((member) => member.muscleIds.length > 0 || !groupIds.has(member.node.id));
  const drawable = listed.filter((member) => member.muscleIds.length > 0);
  const allSelected = result.muscleIds.length > 0 && result.muscleIds.every((id) => selectedIds.includes(id));

  return (
    <div
      data-testid="anatomy-result-list"
      role="region"
      aria-label={`Muscles matching ${title}`}
      className="flex items-center gap-2 border-b border-border/30 px-3 py-1.5 sm:px-4 dark:border-white/10"
    >
      <p className="shrink-0 text-xs font-semibold text-foreground">
        {title}: {drawable.length} {drawable.length === 1 ? 'muscle' : 'muscles'}
      </p>
      <ul className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {listed.map((member) => {
          const note = describeMember(member, current);
          const isDrawn = member.muscleIds.length > 0;
          const isSelected = isDrawn && member.muscleIds.every((id) => selectedIds.includes(id));
          return (
            <li key={member.node.id} className="shrink-0">
              <button
                type="button"
                disabled={!isDrawn}
                aria-pressed={isSelected}
                onClick={() => onSelectMember(member)}
                className={`
                  whitespace-nowrap rounded-full px-2.5 py-1 text-left text-xs transition-colors
                  ${isSelected
                    ? 'bg-primary/25 text-primary ring-1 ring-primary/50'
                    : 'bg-muted/40 text-foreground hover:bg-muted/60 dark:bg-white/5 dark:hover:bg-white/10'
                  }
                  disabled:cursor-not-allowed disabled:opacity-50
                `}
              >
                {member.node.name}
                {note ? <span className="ml-1 text-muted-foreground">({note})</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {onSelectAll && (
        <button
          type="button"
          onClick={onSelectAll}
          disabled={result.muscleIds.length === 0 || allSelected}
          className="shrink-0 rounded-md bg-primary/20 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {allSelected ? 'All selected' : 'Select all'}
        </button>
      )}
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear matches"
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default AnatomyResultList;
