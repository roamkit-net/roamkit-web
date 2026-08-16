/**
 * Search indexing is fail-closed.
 *
 * Both must be true:
 * - SEO_INDEXING_ENABLED === "true"
 * - ROAMKIT_ENVIRONMENT === "production"
 *
 * NODE_ENV is not a production signal (staging images also run NODE_ENV=production).
 * A stray SEO_INDEXING_ENABLED=true on staging cannot open indexing.
 */
export function isSeoIndexingEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    env.SEO_INDEXING_ENABLED === "true" &&
    env.ROAMKIT_ENVIRONMENT === "production"
  );
}
