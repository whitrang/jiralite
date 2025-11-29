const CACHE_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

export interface CachedAIResult {
  result: string;
  cachedAt: string;
  expiresAt: string;
  descriptionUpdatedAt?: string;
}

// In-memory cache storage (will persist during server runtime)
const aiAdviceCache = new Map<string, CachedAIResult>();
const aiLabelsCache = new Map<string, CachedAIResult>();
const aiCommentSummaryCache = new Map<string, CachedAIResult>();

/**
 * Clean expired cache entries
 */
function cleanExpiredEntries(cache: Map<string, CachedAIResult>): void {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (new Date(value.expiresAt).getTime() < now) {
      cache.delete(key);
    }
  }
}

/**
 * Get cached AI advice for an issue
 * @param issueId - Issue ID
 * @param descriptionUpdatedAt - Last description update timestamp
 * @returns Cached result or null
 */
export function getCachedAiAdvice(
  issueId: string,
  descriptionUpdatedAt?: string
): string | null {
  cleanExpiredEntries(aiAdviceCache);

  const cached = aiAdviceCache.get(issueId);
  if (!cached) return null;

  // Check if cache expired
  if (new Date(cached.expiresAt).getTime() < Date.now()) {
    aiAdviceCache.delete(issueId);
    return null;
  }

  // Check if description was updated after cache was created
  if (descriptionUpdatedAt && cached.descriptionUpdatedAt) {
    const cacheTime = new Date(cached.descriptionUpdatedAt).getTime();
    const updateTime = new Date(descriptionUpdatedAt).getTime();

    if (updateTime > cacheTime) {
      // Description was updated, invalidate cache
      aiAdviceCache.delete(issueId);
      return null;
    }
  }

  return cached.result;
}

/**
 * Set cached AI advice for an issue
 * @param issueId - Issue ID
 * @param result - AI result to cache
 * @param descriptionUpdatedAt - Current description update timestamp
 */
export function setCachedAiAdvice(
  issueId: string,
  result: string,
  descriptionUpdatedAt?: string
): void {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

  aiAdviceCache.set(issueId, {
    result,
    cachedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    descriptionUpdatedAt,
  });
}

/**
 * Get cached AI label recommendations for an issue
 * @param issueId - Issue ID
 * @param descriptionUpdatedAt - Last description update timestamp
 * @returns Cached result or null
 */
export function getCachedLabelRecommendations(
  issueId: string,
  descriptionUpdatedAt?: string
): string | null {
  cleanExpiredEntries(aiLabelsCache);

  const cached = aiLabelsCache.get(issueId);
  if (!cached) return null;

  // Check if cache expired
  if (new Date(cached.expiresAt).getTime() < Date.now()) {
    aiLabelsCache.delete(issueId);
    return null;
  }

  // Check if description was updated after cache was created
  if (descriptionUpdatedAt && cached.descriptionUpdatedAt) {
    const cacheTime = new Date(cached.descriptionUpdatedAt).getTime();
    const updateTime = new Date(descriptionUpdatedAt).getTime();

    if (updateTime > cacheTime) {
      // Description was updated, invalidate cache
      aiLabelsCache.delete(issueId);
      return null;
    }
  }

  return cached.result;
}

/**
 * Set cached AI label recommendations for an issue
 * @param issueId - Issue ID
 * @param result - AI result to cache
 * @param descriptionUpdatedAt - Current description update timestamp
 */
export function setCachedLabelRecommendations(
  issueId: string,
  result: string,
  descriptionUpdatedAt?: string
): void {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

  aiLabelsCache.set(issueId, {
    result,
    cachedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    descriptionUpdatedAt,
  });
}

/**
 * Invalidate AI advice cache for an issue
 * @param issueId - Issue ID
 */
export function invalidateAiAdviceCache(issueId: string): void {
  aiAdviceCache.delete(issueId);
}

/**
 * Invalidate label recommendations cache for an issue
 * @param issueId - Issue ID
 */
export function invalidateLabelRecommendationsCache(issueId: string): void {
  aiLabelsCache.delete(issueId);
}

/**
 * Get cached comment summary for an issue
 * @param issueId - Issue ID
 * @param lastCommentTime - Last comment timestamp
 * @returns Cached result or null
 */
export function getCachedCommentSummary(
  issueId: string,
  lastCommentTime?: string
): string | null {
  cleanExpiredEntries(aiCommentSummaryCache);

  const cached = aiCommentSummaryCache.get(issueId);
  if (!cached) return null;

  // Check if cache expired
  if (new Date(cached.expiresAt).getTime() < Date.now()) {
    aiCommentSummaryCache.delete(issueId);
    return null;
  }

  // Check if new comment was added after cache was created
  if (lastCommentTime && cached.descriptionUpdatedAt) {
    const cacheTime = new Date(cached.descriptionUpdatedAt).getTime();
    const commentTime = new Date(lastCommentTime).getTime();

    if (commentTime > cacheTime) {
      // New comment added, invalidate cache
      aiCommentSummaryCache.delete(issueId);
      return null;
    }
  }

  return cached.result;
}

/**
 * Set cached comment summary for an issue
 * @param issueId - Issue ID
 * @param result - AI result to cache
 * @param lastCommentTime - Latest comment timestamp
 */
export function setCachedCommentSummary(
  issueId: string,
  result: string,
  lastCommentTime?: string
): void {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

  aiCommentSummaryCache.set(issueId, {
    result,
    cachedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    descriptionUpdatedAt: lastCommentTime,
  });
}

/**
 * Invalidate comment summary cache for an issue
 * @param issueId - Issue ID
 */
export function invalidateCommentSummaryCache(issueId: string): void {
  aiCommentSummaryCache.delete(issueId);
}

/**
 * Invalidate all AI caches for an issue (when description is updated)
 * @param issueId - Issue ID
 */
export function invalidateAllAiCaches(issueId: string): void {
  invalidateAiAdviceCache(issueId);
  invalidateLabelRecommendationsCache(issueId);
  invalidateCommentSummaryCache(issueId);
}

/**
 * Validate description length for AI features
 * @param description - Description text
 * @returns true if valid (10+ characters)
 */
export function validateDescriptionForAI(description?: string | null): {
  valid: boolean;
  message?: string;
} {
  if (!description || description.trim().length < 10) {
    return {
      valid: false,
      message: 'Description must be at least 10 characters to use AI features',
    };
  }
  return { valid: true };
}
