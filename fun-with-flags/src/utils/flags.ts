import flagsData from '../data/flags.json';
import { Flag, GameScope, DifficultyFilter, UserStats } from '../types';
import type { ColorFlag } from '../data/colorFlags';

const rawBase = import.meta.env.BASE_URL || './';
const cleanBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export const ALL_FLAGS: Flag[] = (flagsData as Flag[]).map((flag) => ({
  ...flag,
  svgPath: flag.svgPath.startsWith('/')
    ? `${cleanBase}${flag.svgPath.slice(1)}`
    : flag.svgPath,
}));

export function filterFlags(
  flags: Flag[],
  scope: GameScope,
  difficulty: DifficultyFilter = 'all'
): Flag[] {
  return flags.filter((flag) => {
    // Difficulty filter
    if (difficulty !== 'all' && flag.difficulty !== difficulty) {
      return false;
    }

    // Scope filter
    switch (scope) {
      case 'all':
        return true;
      case 'sovereign':
        return flag.isSovereign === true;
      case 'countries':
        return flag.type === 'country';
      case 'organizations':
        return flag.type === 'organization';
      case 'historical':
        return flag.type === 'historical';
      case 'cities':
        return flag.type === 'city';
      case 'subdivisions':
        return flag.type === 'subdivision';
      case 'us-states':
        return flag.category === 'US State';
      case 'ca-provinces':
        return flag.category === 'Canadian Province';
      case 'au-states':
        return flag.category === 'Australian State';
      case 'de-states':
        return flag.category === 'German State';
      case 'es-regions':
        return flag.category === 'Spanish Region';
      case 'uk-nations':
        return flag.category === 'UK Nation';
      case 'europe':
        return flag.continent === 'Europe';
      case 'americas':
        return flag.continent === 'North America' || flag.continent === 'South America';
      case 'asia':
        return flag.continent === 'Asia';
      case 'africa':
        return flag.continent === 'Africa';
      case 'oceania':
        return flag.continent === 'Oceania';
      case 'design-stars':
        return flag.designPatterns?.includes('stars') ?? false;
      case 'design-crescents':
        return flag.designPatterns?.includes('crescent') ?? false;
      case 'design-suns':
        return flag.designPatterns?.includes('sun') ?? false;
      case 'design-nordic':
        return flag.designPatterns?.includes('nordic-cross') ?? false;
      case 'design-saltires':
        return flag.designPatterns?.includes('saltire') ?? false;
      case 'design-animals':
        return flag.designPatterns?.includes('animal') ?? false;
      case 'design-tricolors':
        return flag.designPatterns?.includes('tricolor') ?? false;
      case 'design-cantons':
        return flag.designPatterns?.includes('canton') ?? false;
      case 'design-unique-shapes':
        return flag.designPatterns?.includes('unique-shape') ?? false;
      default:
        return true;
    }
  });
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateQuestionOptions(
  targetFlag: Flag,
  availablePool: Flag[],
  count: number = 4
): Flag[] {
  // Try to pick distractors from the same category or continent for plausible options
  const sameCategory = availablePool.filter(
    (f) => f.id !== targetFlag.id && f.category === targetFlag.category
  );
  const sameContinent = availablePool.filter(
    (f) =>
      f.id !== targetFlag.id &&
      f.category !== targetFlag.category &&
      f.continent === targetFlag.continent
  );
  const others = availablePool.filter(
    (f) =>
      f.id !== targetFlag.id &&
      f.category !== targetFlag.category &&
      f.continent !== targetFlag.continent
  );

  const pool = [
    ...shuffle(sameCategory),
    ...shuffle(sameContinent),
    ...shuffle(others),
  ];

  const distractors = pool.slice(0, count - 1);
  return shuffle([targetFlag, ...distractors]);
}

const STATS_STORAGE_KEY = 'fwf_user_stats';

export function getStoredStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse user stats:', e);
  }
  return {
    gamesPlayed: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    bestStreak: 0,
    highScores: {},
    favorites: [],
  };
}

export function saveStoredStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save user stats:', e);
  }
}

export function toggleFavorite(flagId: string): boolean {
  const stats = getStoredStats();
  const index = stats.favorites.indexOf(flagId);
  let isFav = false;
  if (index >= 0) {
    stats.favorites.splice(index, 1);
    isFav = false;
  } else {
    stats.favorites.push(flagId);
    isFav = true;
  }
  saveStoredStats(stats);
  return isFav;
}

export function filterColorFlags(
  allFlags: Flag[],
  colorFlags: ColorFlag[],
  scope: GameScope,
  difficulty: DifficultyFilter = 'all'
): ColorFlag[] {
  const flagMap = new Map<string, Flag>();
  allFlags.forEach((f) => {
    flagMap.set(f.code.toLowerCase(), f);
    flagMap.set(f.id.toLowerCase(), f);
  });

  return colorFlags.filter((cf) => {
    // 1. Difficulty filter based on the color flag's difficulty
    if (difficulty !== 'all' && cf.difficulty !== difficulty) {
      return false;
    }

    // 2. Scope filter
    if (scope === 'all') return true;

    const flag = flagMap.get(cf.countryCode.toLowerCase());
    if (!flag) return true;

    // Check if the underlying Flag matches the scope
    const matches = filterFlags([flag], scope, 'all');
    return matches.length > 0;
  });
}

export function getColorMatchingFlags(
  allFlags: Flag[],
  colorFlags: ColorFlag[],
  scope: GameScope,
  difficulty: DifficultyFilter = 'all'
): Flag[] {
  const filtered = filterColorFlags(allFlags, colorFlags, scope, difficulty);
  const flagMap = new Map<string, Flag>();
  allFlags.forEach((f) => {
    flagMap.set(f.code.toLowerCase(), f);
    flagMap.set(f.id.toLowerCase(), f);
  });
  return filtered
    .map((cf) => flagMap.get(cf.countryCode.toLowerCase()))
    .filter((f): f is Flag => Boolean(f));
}

