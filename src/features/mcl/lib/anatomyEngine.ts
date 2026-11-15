import { muscles } from '../data/muscles';
import { regions, taxonomyNodes, type TaxonomyNode } from '../data/taxonomy';
import type { MuscleHighlight } from '../types';

/**
 * Anatomy engine: turns a typed query or a body region into the same result
 * shape, so search and region selection can never disagree. Pure functions,
 * no React, no DOM, no dependencies.
 */

export interface AnatomyMember {
  node: TaxonomyNode;
  /** Set when the node has no shape of its own and borrows an ancestor's (muscle heads). */
  shownAs: TaxonomyNode | null;
  /** App muscle ids, both sides. Empty when the muscle is not drawn yet. */
  muscleIds: string[];
}

export interface AnatomyResult {
  source: 'search' | 'region';
  node: TaxonomyNode;
  members: AnatomyMember[];
  muscleIds: string[];
}

const MIN_QUERY_LENGTH = 2;
const FUZZY_MIN_LENGTH = 5;
const FUZZY_TWO_EDITS_LENGTH = 8;

const nodeById = new Map<string, TaxonomyNode>(taxonomyNodes.map((node) => [node.id, node]));
const childrenById = new Map<string, TaxonomyNode[]>();
for (const node of taxonomyNodes) {
  if (node.parent === null) continue;
  childrenById.set(node.parent, [...(childrenById.get(node.parent) ?? []), node]);
}
const drawnMuscleIds = new Set(muscles.map((muscle) => muscle.id));

export function normalizeQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function expandSides(baseId: string): string[] {
  return [baseId, `${baseId}-left`, `${baseId}-right`].filter((id) => drawnMuscleIds.has(id));
}

function depthOf(node: TaxonomyNode): number {
  let depth = 0;
  let current = node.parent;
  while (current !== null) {
    depth += 1;
    current = nodeById.get(current)?.parent ?? null;
  }
  return depth;
}

function subtree(node: TaxonomyNode): TaxonomyNode[] {
  const children = childrenById.get(node.id) ?? [];
  return [node, ...children.flatMap(subtree)];
}

function toMember(node: TaxonomyNode): AnatomyMember {
  if (node.muscleIds.length > 0) {
    return { node, shownAs: null, muscleIds: node.muscleIds.flatMap(expandSides) };
  }
  const isLeaf = (childrenById.get(node.id) ?? []).length === 0;
  if (isLeaf) {
    let ancestor = node.parent === null ? undefined : nodeById.get(node.parent);
    while (ancestor) {
      if (ancestor.muscleIds.length > 0) {
        return { node, shownAs: ancestor, muscleIds: ancestor.muscleIds.flatMap(expandSides) };
      }
      ancestor = ancestor.parent === null ? undefined : nodeById.get(ancestor.parent);
    }
  }
  return { node, shownAs: null, muscleIds: [] };
}

function buildResult(source: AnatomyResult['source'], node: TaxonomyNode, roots: TaxonomyNode[]): AnatomyResult {
  const seen = new Set<string>();
  const members: AnatomyMember[] = [];
  for (const candidate of roots.flatMap(subtree)) {
    if (seen.has(candidate.id) || !candidate.selectable) continue;
    seen.add(candidate.id);
    members.push(toMember(candidate));
  }
  const muscleIds = Array.from(new Set(members.flatMap((member) => member.muscleIds)));
  return { source, node, members, muscleIds };
}

function editDistance(first: string, second: string): number {
  if (first === second) return 0;
  let previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let row = 1; row <= first.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= second.length; column += 1) {
      const substitution = previous[column - 1] + (first[row - 1] === second[column - 1] ? 0 : 1);
      current.push(Math.min(previous[column] + 1, current[column - 1] + 1, substitution));
    }
    previous = current;
  }
  return previous[second.length];
}

/** 0 exact, 1 starts-with, 2 contains, 3 near miss, null no match. */
function scoreTerm(query: string, term: string): number | null {
  if (term === query) return 0;
  if (term.startsWith(query)) return 1;
  if (term.includes(query)) return 2;
  if (query.length < FUZZY_MIN_LENGTH) return null;
  const allowedEdits = query.length >= FUZZY_TWO_EDITS_LENGTH ? 2 : 1;
  const candidates = [term, ...term.split(' ')];
  return candidates.some((candidate) => editDistance(query, candidate) <= allowedEdits) ? 3 : null;
}

function scoreNode(query: string, node: TaxonomyNode): number | null {
  let best: number | null = null;
  for (const term of [node.name, ...node.aliases]) {
    const score = scoreTerm(query, normalizeQuery(term));
    if (score !== null && (best === null || score < best)) best = score;
  }
  return best;
}

export function resolveSearch(query: string): AnatomyResult[] {
  const normalized = normalizeQuery(query);
  if (normalized.length < MIN_QUERY_LENGTH) return [];

  const scored: { node: TaxonomyNode; score: number; depth: number }[] = [];
  for (const node of taxonomyNodes) {
    if (!node.selectable) continue;
    const score = scoreNode(normalized, node);
    if (score !== null) scored.push({ node, score, depth: depthOf(node) });
  }
  scored.sort(
    (first, second) =>
      first.score - second.score || first.depth - second.depth || first.node.name.localeCompare(second.node.name)
  );
  return scored.map(({ node }) => buildResult('search', node, [node]));
}

export function resolveRegion(regionId: string): AnatomyResult | null {
  const ids = regions[regionId];
  if (!ids) return null;
  const roots = ids.map((id) => nodeById.get(id)).filter((node): node is TaxonomyNode => node !== undefined);
  if (roots.length === 0) return null;
  return buildResult('region', roots[0], roots);
}

/** The single path from muscle ids to canvas highlights, used by search and regions alike. */
export function toFocusHighlights(muscleIds: string[]): MuscleHighlight[] {
  return muscleIds.map((muscleId) => ({ muscleId, type: 'focus', intensity: 100 }));
}
