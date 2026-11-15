import { z } from 'zod';
import rawTaxonomy from './muscle-taxonomy.json';
import rawRegions from './regions.json';

/**
 * Muscle taxonomy: a tree of body areas, muscles and muscle heads with the
 * nicknames people actually type. `muscleIds` point at entries in
 * `data/muscles.ts` without the side suffix (`biceps`, not `biceps-left`).
 */
const TaxonomyNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parent: z.string().min(1).nullable(),
  aliases: z.array(z.string().min(1)),
  region: z.string().min(1),
  muscleIds: z.array(z.string().min(1)),
  selectable: z.boolean().default(true),
});

const RegionsSchema = z.record(z.string().min(1), z.array(z.string().min(1)).min(1));

export type TaxonomyNode = z.infer<typeof TaxonomyNodeSchema>;

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown, label: string): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(`Invalid ${label}: ${result.error.message}`);
  }
  return result.data;
}

export const taxonomyNodes: readonly TaxonomyNode[] = parseOrThrow(
  z.array(TaxonomyNodeSchema),
  rawTaxonomy,
  'muscle taxonomy'
);

export const regions: Readonly<Record<string, string[]>> = parseOrThrow(
  RegionsSchema,
  rawRegions,
  'regions'
);

/** Regions offered as chips. Head and feet have no drawn muscles. */
export const REGION_CHIPS: readonly { id: string; label: string }[] = [
  { id: 'neck', label: 'Neck' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
  { id: 'hips', label: 'Hips' },
  { id: 'legs', label: 'Legs' },
];
