const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];
const TOTAL_STAGES = REVIEW_INTERVALS.length;
const MS_PER_DAY = 86400000;

export type ReviewRecord = {
  reviewedAt: number;
  stage: number;
};

export function getTotalStages(): number {
  return TOTAL_STAGES;
}

export function calculateNextReviewAt(reviewCount: number, baseTime: number): number {
  const stage = Math.min(reviewCount, TOTAL_STAGES - 1);
  const intervalDays = REVIEW_INTERVALS[stage];
  return baseTime + intervalDays * MS_PER_DAY;
}

export function getInitialNextReviewAt(createdAt: number): number {
  return createdAt + REVIEW_INTERVALS[0] * MS_PER_DAY;
}

export type ReviewStatus =
  | { type: "completed"; label: "已完成全部复习" }
  | { type: "due"; label: string; daysOverdue: number }
  | { type: "upcoming"; label: string; daysUntil: number };

export function getReviewStatus(
  reviewCount: number,
  nextReviewAt: number | null
): ReviewStatus {
  if (reviewCount >= TOTAL_STAGES) {
    return { type: "completed", label: "已完成全部复习" };
  }
  if (!nextReviewAt) {
    return { type: "due", label: "今日待复习", daysOverdue: 0 };
  }

  const now = Date.now();
  const startOfToday = getStartOfDay(now);
  const startOfReview = getStartOfDay(nextReviewAt);

  const diffDays = Math.floor((startOfReview - startOfToday) / MS_PER_DAY);

  if (diffDays <= 0) {
    const overdue = Math.abs(diffDays);
    return {
      type: "due",
      label: overdue === 0 ? "今日待复习" : `已逾期 ${overdue} 天`,
      daysOverdue: overdue,
    };
  }

  return {
    type: "upcoming",
    label: diffDays === 1 ? "明天复习" : `${diffDays} 天后复习`,
    daysUntil: diffDays,
  };
}

export function getStageName(reviewCount: number): string {
  if (reviewCount >= TOTAL_STAGES) return "已完成";
  return `第 ${reviewCount + 1} 次 / 共 ${TOTAL_STAGES} 次`;
}

export function getStageInterval(reviewCount: number): string {
  if (reviewCount >= TOTAL_STAGES) return "";
  const days = REVIEW_INTERVALS[Math.min(reviewCount, TOTAL_STAGES - 1)];
  return `间隔 ${days} 天`;
}

export function getProgressPercent(reviewCount: number): number {
  return Math.min(reviewCount / TOTAL_STAGES, 1);
}

export function formatReviewDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function isReviewDue(reviewCount: number, nextReviewAt: number | null): boolean {
  if (reviewCount >= TOTAL_STAGES) return false;
  if (!nextReviewAt) return true;
  return getStartOfDay(nextReviewAt) <= getStartOfDay(Date.now());
}

function getStartOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
