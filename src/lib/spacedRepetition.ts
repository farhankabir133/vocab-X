
export interface SpacedRepetitionData {
  interval: number;
  easeFactor: number;
  repetitions: number;
  masteryLevel: number;
}

/**
 * SuperMemo-2 (SM-2) algorithm implementation.
 * @param quality 0-5 quality of recall.
 * @param current Current SR statistics.
 */
export function calculateNextReview(
  quality: number,
  current: SpacedRepetitionData
) {
  let { interval, easeFactor, repetitions, masteryLevel } = current;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions++;
  } else {
    // Incorrect response
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Mastery level logic: increases with correct answers, decreases with incorrect.
  const masteryChange = (quality - 2) * 5; // quality 3 -> +5, quality 5 -> +15, quality 0 -> -10
  masteryLevel = Math.min(100, Math.max(0, masteryLevel + masteryChange));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    interval,
    easeFactor,
    repetitions,
    masteryLevel,
    nextReview: nextReview.toISOString()
  };
}
