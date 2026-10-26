export interface Flag {
  id: string;
  code: string;
  name: string;
  officialName: string;
  type: 'country' | 'subdivision' | 'organization' | 'historical' | 'city';
  category: string;
  parentCountry: string | null;
  continent: string;
  capital: string;
  svgPath: string;
  trivia: string;
  difficulty: number;
  tags: string[];
  colors?: string[];
  isSovereign?: boolean;
  designPatterns?: string[];
}

export type GameMode =
  | 'quiz'
  | 'reverse_quiz'
  | 'type'
  | 'blitz'
  | 'memory'
  | 'zoom'
  | 'streak'
  | 'color'
  | 'library';

export type GameScope =
  // Geographic / Entity scopes
  | 'all'
  | 'sovereign'
  | 'countries'
  | 'organizations'
  | 'historical'
  | 'cities'
  | 'subdivisions'
  | 'us-states'
  | 'ca-provinces'
  | 'au-states'
  | 'de-states'
  | 'es-regions'
  | 'uk-nations'
  | 'europe'
  | 'americas'
  | 'asia'
  | 'africa'
  | 'oceania'
  // Vexillological Design scopes
  | 'design-stars'
  | 'design-crescents'
  | 'design-suns'
  | 'design-nordic'
  | 'design-saltires'
  | 'design-animals'
  | 'design-tricolors'
  | 'design-cantons'
  | 'design-unique-shapes';

export type DifficultyFilter = 'all' | 1 | 2 | 3;

export interface UserStats {
  gamesPlayed: number;
  totalCorrect: number;
  totalAttempts: number;
  bestStreak: number;
  highScores: {
    quiz?: number;
    reverse_quiz?: number;
    type?: number;
    blitz?: number;
    memory?: number;
    zoom?: number;
    streak?: number;
    color?: number;
  };
  favorites: string[];
}
