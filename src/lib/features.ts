/**
 * Launch surface control.
 *
 * Flipping a flag to true restores the feature's nav entry. Routes stay
 * registered either way, so direct URLs keep working for testing.
 */
export const FEATURES = {
  training: false,
  messages: false,
  feed: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;
