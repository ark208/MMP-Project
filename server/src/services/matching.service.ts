import { prisma } from '../config/prisma';
import { notificationService } from './notification.service';

export interface LostItemData {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  dateLost: Date | string;
  status?: string;
  imageUrl?: string | null;
}

export interface FoundItemData {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  dateFound: Date | string;
  status?: string;
  imageUrl?: string | null;
  holdingLocation?: string;
}

export interface ScoringWeights {
  category: number;
  text: number;
  location: number;
  time: number;
}

export interface ScoringOptions {
  threshold?: number;
  weights?: Partial<ScoringWeights>;
}

export interface MatchScoreResult {
  score: number; // 0.0 to 1.0 (rounded to 2 decimal places)
  isMatch: boolean;
  reasons: string[];
  breakdown: {
    categoryScore: number;
    textScore: number;
    locationScore: number;
    timeScore: number;
  };
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  category: 0.25,
  text: 0.35,
  location: 0.20,
  time: 0.20,
};

export const DEFAULT_MATCH_THRESHOLD = 0.55;

// Common English stopwords to ignore in text similarity
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'lost',
  'found', 'missing', 'left', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off',
  'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who',
  'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Generates character trigrams for pg_trgm style similarity.
 * Padds string with leading and trailing spaces.
 */
export function generateTrigrams(str: string): Set<string> {
  const normalized = `  ${str.toLowerCase().trim()} `;
  const trigrams = new Set<string>();
  for (let i = 0; i <= normalized.length - 3; i++) {
    trigrams.add(normalized.substring(i, i + 3));
  }
  return trigrams;
}

/**
 * Calculates pg_trgm similarity (Jaccard similarity of character trigrams).
 * Returns a value between 0.0 and 1.0.
 */
export function calculateTrigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const cleanA = a.toLowerCase().trim();
  const cleanB = b.toLowerCase().trim();
  if (cleanA === cleanB) return 1.0;

  const trigramsA = generateTrigrams(cleanA);
  const trigramsB = generateTrigrams(cleanB);

  if (trigramsA.size === 0 || trigramsB.size === 0) return 0;

  let intersectionCount = 0;
  for (const tri of trigramsA) {
    if (trigramsB.has(tri)) {
      intersectionCount++;
    }
  }

  const unionCount = trigramsA.size + trigramsB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Tokenizes text, cleans non-alphanumeric chars, removes stopwords.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * Computes TF-IDF / Cosine similarity between two texts.
 */
export function calculateTfIdfCosineSimilarity(textA: string, textB: string): { similarity: number; matchingKeywords: string[] } {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return { similarity: 0, matchingKeywords: [] };
  }

  const tfA = new Map<string, number>();
  const tfB = new Map<string, number>();

  for (const t of tokensA) tfA.set(t, (tfA.get(t) || 0) + 1);
  for (const t of tokensB) tfB.set(t, (tfB.get(t) || 0) + 1);

  const allWords = new Set([...tfA.keys(), ...tfB.keys()]);
  const matchingKeywords: string[] = [];

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const word of allWords) {
    const freqA = tfA.get(word) || 0;
    const freqB = tfB.get(word) || 0;

    if (freqA > 0 && freqB > 0) {
      matchingKeywords.push(word);
    }

    dotProduct += freqA * freqB;
    magA += freqA * freqA;
    magB += freqB * freqB;
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  const similarity = magnitude === 0 ? 0 : dotProduct / magnitude;

  return { similarity, matchingKeywords };
}

/**
 * 1. Category Matching Score (0.0 to 1.0)
 */
export function scoreCategory(categoryLost: string, categoryFound: string): { score: number; reason?: string } {
  const c1 = categoryLost.toLowerCase().trim();
  const c2 = categoryFound.toLowerCase().trim();

  if (c1 === c2) {
    return { score: 1.0, reason: `Matching category: ${categoryLost}` };
  }

  // Cross-category affinities (e.g., Electronics vs Tech Accessories)
  const isOther = c1 === 'other' || c2 === 'other' || c1 === 'miscellaneous' || c2 === 'miscellaneous';
  if (isOther) {
    return { score: 0.3 };
  }

  return { score: 0.0 };
}

/**
 * 2. Text Similarity Score (Title & Description) (0.0 to 1.0)
 */
export function scoreText(
  lost: { title: string; description: string },
  found: { title: string; description: string }
): { score: number; reason?: string } {
  // Title similarity (Trigram + TF-IDF)
  const titleTrigram = calculateTrigramSimilarity(lost.title, found.title);
  const titleTfIdf = calculateTfIdfCosineSimilarity(lost.title, found.title);
  const titleSim = Math.max(titleTrigram, titleTfIdf.similarity);

  // Description similarity
  const descTrigram = calculateTrigramSimilarity(lost.description, found.description);
  const descTfIdf = calculateTfIdfCosineSimilarity(lost.description, found.description);
  const descSim = (descTrigram + descTfIdf.similarity) / 2;

  // Cross-match: title vs description (often found item description mentions lost item title)
  const crossLostToFound = calculateTfIdfCosineSimilarity(lost.title, found.description).similarity;
  const crossFoundToLost = calculateTfIdfCosineSimilarity(found.title, lost.description).similarity;
  const bestCross = Math.max(crossLostToFound, crossFoundToLost);

  // Weighted combination: Title is strong signal (50%), description (30%), cross (20%)
  const combined = (titleSim * 0.50) + (descSim * 0.30) + (bestCross * 0.20);
  const score = Math.min(1.0, Math.max(0.0, combined));

  let reason: string | undefined;
  const matchedKeywords = Array.from(new Set([...titleTfIdf.matchingKeywords, ...descTfIdf.matchingKeywords]));
  if (score >= 0.4) {
    const percent = Math.round(score * 100);
    if (matchedKeywords.length > 0) {
      reason = `Text similarity: ${percent}% (keywords: ${matchedKeywords.slice(0, 3).join(', ')})`;
    } else {
      reason = `High text similarity (${percent}%) in title/description`;
    }
  }

  return { score, reason };
}

/**
 * 3. Location Proximity Score (0.0 to 1.0)
 */
export function scoreLocation(locA: string, locB: string): { score: number; reason?: string } {
  const normA = locA.toLowerCase().trim();
  const normB = locB.toLowerCase().trim();

  if (normA === normB) {
    return { score: 1.0, reason: `Exact location match: ${locA}` };
  }

  // Token overlap & substring check (e.g., "Student Union" vs "Student Union 2nd floor")
  const tokensA = tokenize(locA);
  const tokensB = tokenize(locB);
  const setB = new Set(tokensB);
  const common = tokensA.filter((t) => setB.has(t));

  if (common.length > 0) {
    const overlapRatio = (2 * common.length) / (tokensA.length + tokensB.length);
    const score = Math.min(1.0, Math.max(0.7, overlapRatio));
    return { score, reason: `Nearby location: both mention ${common.join(', ')}` };
  }

  // Fallback to trigram similarity on location strings
  const triSim = calculateTrigramSimilarity(normA, normB);
  if (triSim >= 0.5) {
    return { score: triSim, reason: `Similar location: "${locA}" and "${locB}"` };
  }

  return { score: 0.0 };
}

/**
 * 4. Time Proximity Score (0.0 to 1.0)
 */
export function scoreTime(dateLost: Date | string, dateFound: Date | string): { score: number; reason?: string } {
  const dLost = new Date(dateLost).getTime();
  const dFound = new Date(dateFound).getTime();

  if (isNaN(dLost) || isNaN(dFound)) {
    return { score: 0.5 };
  }

  const diffHours = Math.abs(dLost - dFound) / (1000 * 60 * 60);

  if (diffHours <= 6) {
    const hrs = Math.round(diffHours * 10) / 10;
    return { score: 1.0, reason: `Reported within ${hrs <= 1 ? '1 hour' : `${hrs} hours`} of each other` };
  }
  if (diffHours <= 24) {
    const hrs = Math.round(diffHours);
    return { score: 0.85, reason: `Reported within ${hrs} hours` };
  }
  if (diffHours <= 48) {
    return { score: 0.70, reason: 'Reported within 2 days' };
  }
  if (diffHours <= 7 * 24) {
    const days = Math.round(diffHours / 24);
    return { score: 0.45, reason: `Reported within ${days} days` };
  }
  if (diffHours <= 14 * 24) {
    return { score: 0.20, reason: 'Reported within 2 weeks' };
  }

  return { score: 0.0 };
}

/**
 * Comprehensive Match Scorer
 * Scores a LostItem against a FoundItem and calculates whether it meets the threshold.
 */
export function scoreLostAndFoundItem(
  lost: LostItemData,
  found: FoundItemData,
  options?: ScoringOptions
): MatchScoreResult {
  const weights: ScoringWeights = {
    ...DEFAULT_WEIGHTS,
    ...(options?.weights || {}),
  };
  const threshold = options?.threshold ?? DEFAULT_MATCH_THRESHOLD;

  const catResult = scoreCategory(lost.category, found.category);
  const textResult = scoreText(lost, found);
  const locResult = scoreLocation(lost.location, found.location);
  const timeResult = scoreTime(lost.dateLost, found.dateFound);

  // If category is completely incompatible and text similarity is very low, short-circuit
  if (catResult.score === 0 && textResult.score < 0.2) {
    return {
      score: 0.0,
      isMatch: false,
      reasons: [],
      breakdown: {
        categoryScore: 0,
        textScore: textResult.score,
        locationScore: locResult.score,
        timeScore: timeResult.score,
      },
    };
  }

  const weightedScore =
    catResult.score * weights.category +
    textResult.score * weights.text +
    locResult.score * weights.location +
    timeResult.score * weights.time;

  const score = Math.round(Math.min(1.0, Math.max(0.0, weightedScore)) * 100) / 100;
  const isMatch = score >= threshold;

  const reasons: string[] = [];
  if (catResult.reason) reasons.push(catResult.reason);
  if (textResult.reason) reasons.push(textResult.reason);
  if (locResult.reason) reasons.push(locResult.reason);
  if (timeResult.reason) reasons.push(timeResult.reason);

  return {
    score,
    isMatch,
    reasons,
    breakdown: {
      categoryScore: catResult.score,
      textScore: textResult.score,
      locationScore: locResult.score,
      timeScore: timeResult.score,
    },
  };
}

/**
 * Matching Orchestrator Service
 */
export const matchingService = {
  /**
   * Called when a LostItem is created:
   * Scores against all open FoundItems, creates Match records, and triggers notifications.
   */
  async matchNewLostItem(lostItem: LostItemData) {
    try {
      const openFoundItems = await (prisma as any).foundItem.findMany({
        where: {
          status: 'open',
          isExpired: false,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      const matchesCreated = [];

      for (const foundItem of openFoundItems) {
        // Do not match if the same user posted both
        if (lostItem.userId === foundItem.userId) continue;

        const result = scoreLostAndFoundItem(lostItem, foundItem);
        if (result.isMatch) {
          const matchRecord = await this.saveMatchAndNotify(lostItem, foundItem, result);
          if (matchRecord) {
            matchesCreated.push(matchRecord);
          }
        }
      }

      return matchesCreated;
    } catch (err) {
      console.error('[MatchingService] Error matching lost item:', err);
      return [];
    }
  },

  /**
   * Called when a FoundItem is created:
   * Scores against all open LostItems, creates Match records, and triggers notifications.
   */
  async matchNewFoundItem(foundItem: FoundItemData) {
    try {
      const openLostItems = await (prisma as any).lostItem.findMany({
        where: {
          status: 'open',
          isExpired: false,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      const matchesCreated = [];

      for (const lostItem of openLostItems) {
        if (lostItem.userId === foundItem.userId) continue;

        const result = scoreLostAndFoundItem(lostItem, foundItem);
        if (result.isMatch) {
          const matchRecord = await this.saveMatchAndNotify(lostItem, foundItem, result);
          if (matchRecord) {
            matchesCreated.push(matchRecord);
          }
        }
      }

      return matchesCreated;
    } catch (err) {
      console.error('[MatchingService] Error matching found item:', err);
      return [];
    }
  },

  /**
   * Creates or updates a Match record in the database and triggers notifications
   */
  async saveMatchAndNotify(
    lostItem: LostItemData,
    foundItem: FoundItemData,
    matchResult: MatchScoreResult
  ) {
    try {
      let matchRecord: any = null;

      // Check if match model exists on Prisma
      if ((prisma as any).match) {
        matchRecord = await (prisma as any).match.upsert({
          where: {
            lostItemId_foundItemId: {
              lostItemId: lostItem.id,
              foundItemId: foundItem.id,
            },
          },
          update: {
            score: matchResult.score,
            reasons: matchResult.reasons,
            status: 'PENDING',
          },
          create: {
            lostItemId: lostItem.id,
            foundItemId: foundItem.id,
            score: matchResult.score,
            reasons: matchResult.reasons,
            status: 'PENDING',
          },
        });
      } else {
        matchRecord = {
          id: `match_${Date.now()}`,
          lostItemId: lostItem.id,
          foundItemId: foundItem.id,
          score: matchResult.score,
          reasons: matchResult.reasons,
          status: 'PENDING',
          createdAt: new Date(),
        };
      }

      // Send notifications to both users
      await notificationService.notifyItemMatch({
        lostItem,
        foundItem,
        matchId: matchRecord.id,
        score: matchResult.score,
        reasons: matchResult.reasons,
      });

      return matchRecord;
    } catch (err) {
      console.error('[MatchingService] Failed to save match & notify:', err);
      return null;
    }
  },
};

