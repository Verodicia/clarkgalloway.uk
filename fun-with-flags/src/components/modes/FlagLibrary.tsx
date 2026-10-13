import React, { useState, useMemo } from 'react';
import { Flag, UserStats } from '../../types';
import { FlagImage } from '../FlagImage';
import { sounds } from '../../utils/sound';
import { toggleFavorite, shuffle } from '../../utils/flags';
import {
  Search,
  Star,
  BookOpen,
  Layers,
  MapPin,
  Building2,
  Globe2,
  X,
  Target,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Filter,
  ChevronDown,
  RotateCcw,
  Shuffle,
} from 'lucide-react';

interface FlagLibraryProps {
  allFlags: Flag[];
  userStats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
  onLaunchDrill: (flag: Flag) => void;
}

export const FlagLibrary: React.FC<FlagLibraryProps> = ({
  allFlags,
  userStats,
  onUpdateStats,
  onLaunchDrill,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFlag, setActiveFlag] = useState<Flag | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'flashcard'>('grid');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Counts map for options
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of allFlags) {
      counts[f.category] = (counts[f.category] || 0) + 1;
      if (f.designPatterns) {
        for (const p of f.designPatterns) {
          const key = `design:${p}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    }
    return counts;
  }, [allFlags]);

  // Entity categories ordered logically
  const entityCategories = useMemo(() => {
    const cats = Array.from(new Set(allFlags.map((f) => f.category)));
    const priority = [
      'Sovereign Country',
      'International Organization',
      'Historical Empire',
      'World City',
      'Territory / Dependency',
      'US State',
      'Canadian Province',
      'German State',
      'Australian State',
      'Spanish Region',
      'UK Nation',
      'Mexican State',
      'Colombian Department',
    ];
    return cats.sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [allFlags]);

  const DESIGN_OPTIONS = useMemo(
    () => [
      { id: 'design:nordic-cross', label: 'Nordic Crosses', icon: '✝️' },
      { id: 'design:crescent', label: 'Crescents & Moons', icon: '🌙' },
      { id: 'design:sun', label: 'Radiant Suns', icon: '☀️' },
      { id: 'design:stars', label: 'Stars & Constellations', icon: '⭐' },
      { id: 'design:animal', label: 'Animals, Birds & Dragons', icon: '🐉' },
      { id: 'design:saltire', label: 'Saltires & X-Crosses', icon: '❌' },
      { id: 'design:canton', label: 'Canton Flags', icon: '📐' },
      { id: 'design:tricolor', label: 'Tricolors & Tribands', icon: '🚩' },
      { id: 'design:unique-shape', label: 'Unique Shapes & Squares', icon: '✂️' },
    ],
    []
  );

  // Filtered flags
  const filteredFlags = useMemo(() => {
    return allFlags.filter((flag) => {
      // Category / Design filter
      if (selectedCategory === 'favorites') {
        if (!userStats.favorites.includes(flag.id)) return false;
      } else if (selectedCategory.startsWith('design:')) {
        const pattern = selectedCategory.replace('design:', '');
        if (!flag.designPatterns?.includes(pattern)) return false;
      } else if (selectedCategory !== 'all') {
        if (flag.category !== selectedCategory) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = flag.name.toLowerCase().includes(query);
        const matchesCode = flag.code.toLowerCase().includes(query);
        const matchesCapital = flag.capital.toLowerCase().includes(query);
        const matchesParent = flag.parentCountry?.toLowerCase().includes(query) || false;
        const matchesTrivia = flag.trivia.toLowerCase().includes(query);
        return matchesName || matchesCode || matchesCapital || matchesParent || matchesTrivia;
      }

      return true;
    });
  }, [allFlags, selectedCategory, searchQuery, userStats.favorites]);

  const handleToggleFavorite = (flag: Flag, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playClick();
    const isNowFav = toggleFavorite(flag.id);
    const newFavs = isNowFav
      ? [...userStats.favorites, flag.id]
      : userStats.favorites.filter((id) => id !== flag.id);
    onUpdateStats({ ...userStats, favorites: newFavs });
  };

  // Flashcard deck: shuffled or default alphabetical order
  const flashcardDeck = useMemo(() => {
    if (!isShuffled) return filteredFlags;
    return shuffle(filteredFlags);
  }, [filteredFlags, isShuffled, shuffleSeed]);

  const currentFlashcard = flashcardDeck[flashcardIndex] || flashcardDeck[0];

  const handleToggleShuffle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playClick();
    setIsShuffled((prev) => !prev);
    setShuffleSeed((s) => s + 1);
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
  };

  const handleReshuffle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playClick();
    setIsShuffled(true);
    setShuffleSeed((s) => s + 1);
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
  };

  // Keyboard navigation for Flashcard study mode
  React.useEffect(() => {
    if (viewMode !== 'flashcard') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault();
        setFlashcardIndex((i) => Math.min(flashcardDeck.length - 1, i + 1));
        setFlashcardFlipped(false);
        sounds.playClick();
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault();
        setFlashcardIndex((i) => Math.max(0, i - 1));
        setFlashcardFlipped(false);
        sounds.playClick();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlashcardFlipped((f) => !f);
        sounds.playClick();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleReshuffle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, flashcardDeck.length]);

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFlashcardIndex(0);
              }}
              placeholder="Search flags by name, capital, state, country, or trivia..."
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-amber-500 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-colors placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700/60 shrink-0">
            <button
              onClick={() => {
                setViewMode('grid');
                sounds.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => {
                setViewMode('flashcard');
                sounds.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'flashcard'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Flashcard Study</span>
            </button>
          </div>
        </div>

        {/* Category & Design Dropdown Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Category Filter:</span>
            </div>

            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setFlashcardIndex(0);
                  sounds.playClick();
                }}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500/60 text-slate-100 text-xs sm:text-sm font-semibold rounded-xl pl-3.5 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer appearance-none shadow-md"
              >
                <option value="all" className="bg-slate-900 text-slate-100 font-bold">
                  🌍 All Flags ({allFlags.length})
                </option>

                <option value="favorites" className="bg-slate-900 text-amber-300 font-bold">
                  ⭐ Saved Favorites ({userStats.favorites.length})
                </option>

                <optgroup label="🏛️ Sovereign & Global Entities" className="bg-slate-900 text-slate-300 font-semibold">
                  {entityCategories
                    .filter((cat) =>
                      [
                        'Sovereign Country',
                        'International Organization',
                        'Historical Empire',
                        'World City',
                        'Territory / Dependency',
                      ].includes(cat)
                    )
                    .map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                        {cat} ({categoryCounts[cat] || 0})
                      </option>
                    ))}
                </optgroup>

                <optgroup label="🗺️ States, Nations & Provinces" className="bg-slate-900 text-slate-300 font-semibold">
                  {entityCategories
                    .filter(
                      (cat) =>
                        ![
                          'Sovereign Country',
                          'International Organization',
                          'Historical Empire',
                          'World City',
                          'Territory / Dependency',
                        ].includes(cat)
                    )
                    .map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                        {cat} ({categoryCounts[cat] || 0})
                      </option>
                    ))}
                </optgroup>

                <optgroup label="🎨 Vexillological Design Patterns" className="bg-slate-900 text-amber-300 font-semibold">
                  {DESIGN_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-100">
                      {opt.icon} {opt.label} ({categoryCounts[opt.id] || 0})
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {selectedCategory !== 'all' && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setFlashcardIndex(0);
                  sounds.playClick();
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700/80 cursor-pointer transition-all"
                title="Reset to All Flags"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Active status & counts */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>
              Showing <strong className="text-white font-bold">{filteredFlags.length}</strong> of{' '}
              {allFlags.length} flags
            </span>
            {userStats.favorites.length > 0 && selectedCategory !== 'favorites' && (
              <button
                onClick={() => {
                  setSelectedCategory('favorites');
                  setFlashcardIndex(0);
                  sounds.playClick();
                }}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
              >
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{userStats.favorites.length} saved</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredFlags.map((flag) => {
            const isFav = userStats.favorites.includes(flag.id);

            return (
              <div
                key={flag.id}
                onClick={() => {
                  setActiveFlag(flag);
                  sounds.playClick();
                }}
                className="group relative bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-xl p-2.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 cursor-pointer flex flex-col justify-between"
              >
                {/* Favorite Star */}
                <button
                  onClick={(e) => handleToggleFavorite(flag, e)}
                  className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-md bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      isFav ? 'fill-amber-400 text-amber-400' : ''
                    }`}
                  />
                </button>

                {/* Flag Visual */}
                <div className="w-full h-24 sm:h-28 rounded-lg overflow-hidden border border-slate-800/80 bg-slate-950/60 flex items-center justify-center p-1.5">
                  <FlagImage flag={flag} className="w-full h-full bg-transparent border-0" shadow={false} />
                </div>

                {/* Flag Info */}
                <div className="mt-2.5 text-center">
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                    {flag.name}
                  </h4>
                  <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                    {flag.parentCountry ? `${flag.category}` : flag.continent}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flashcard Study Mode */}
      {viewMode === 'flashcard' && currentFlashcard && (
        <div className="flex flex-col items-center max-w-lg mx-auto w-full gap-5">
          <div
            onClick={() => {
              setFlashcardFlipped(!flashcardFlipped);
              sounds.playClick();
            }}
            className={`w-full min-h-[340px] rounded-2xl border-2 p-6 transition-all duration-300 cursor-pointer shadow-2xl flex flex-col justify-between ${
              flashcardFlipped
                ? 'bg-slate-850 border-amber-500/80 shadow-amber-500/10'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">
                  Card {flashcardIndex + 1} of {flashcardDeck.length}
                </span>
                <span className="text-slate-700">•</span>
                <button
                  onClick={handleToggleShuffle}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    isShuffled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-750'
                  }`}
                  title={
                    isShuffled
                      ? 'Randomized order active. Click to switch to alphabetical A-Z order.'
                      : 'Alphabetical A-Z order. Click to randomize/shuffle deck.'
                  }
                >
                  <Shuffle className={`w-3 h-3 ${isShuffled ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{isShuffled ? 'Shuffled' : 'Order: A-Z'}</span>
                </button>
                {isShuffled && (
                  <button
                    onClick={handleReshuffle}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 border border-slate-700 transition-colors cursor-pointer"
                    title="Reshuffle Deck into new random order"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                onClick={(e) => handleToggleFavorite(currentFlashcard, e)}
                className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                title={userStats.favorites.includes(currentFlashcard.id) ? 'Saved in favorites' : 'Add to favorites'}
              >
                <Star
                  className={`w-4 h-4 ${
                    userStats.favorites.includes(currentFlashcard.id)
                      ? 'fill-amber-400 text-amber-400'
                      : ''
                  }`}
                />
              </button>
            </div>

            {/* Card Face */}
            {!flashcardFlipped ? (
              <div className="flex flex-col items-center justify-center my-auto gap-4">
                <div className="w-full max-w-sm h-48 sm:h-52 rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950/60 flex items-center justify-center p-3">
                  <FlagImage flag={currentFlashcard} className="w-full h-full bg-transparent border-0" shadow={false} />
                </div>
                <p className="text-xs text-amber-400 font-medium flex items-center gap-1.5 animate-pulse">
                  <RotateCw className="w-3.5 h-3.5" />
                  Click card to reveal details & trivia
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center my-auto gap-3 animate-in fade-in duration-200">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {currentFlashcard.category}
                </span>
                <h3 className="text-2xl font-black text-white">{currentFlashcard.name}</h3>
                {currentFlashcard.parentCountry && (
                  <p className="text-xs text-slate-300">
                    Part of <strong>{currentFlashcard.parentCountry}</strong>
                  </p>
                )}
                {currentFlashcard.capital && currentFlashcard.capital !== 'N/A' && (
                  <p className="text-sm text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    Capital: <strong>{currentFlashcard.capital}</strong>
                  </p>
                )}

                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl mt-2 text-xs text-slate-300 text-left leading-relaxed">
                  <strong className="text-amber-400 block mb-1">Trivia:</strong>
                  {currentFlashcard.trivia}
                </div>
              </div>
            )}

            {/* Bottom prompt */}
            <div className="text-center text-[11px] text-slate-500">
              {flashcardFlipped ? 'Click again to view flag' : 'Click to flip'}
            </div>
          </div>

          {/* Flashcard Navigation */}
          <div className="flex items-center justify-between w-full px-2 gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => {
                setFlashcardIndex((i) => Math.max(0, i - 1));
                setFlashcardFlipped(false);
                sounds.playClick();
              }}
              disabled={flashcardIndex === 0}
              className="flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReshuffle}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isShuffled
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                    : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                }`}
                title="Shuffle card deck into random order"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                <span>{isShuffled ? 'Reshuffle' : 'Shuffle Deck'}</span>
              </button>

              <button
                onClick={() => onLaunchDrill(currentFlashcard)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
              >
                <Target className="w-4 h-4" />
                <span>Quiz This Flag</span>
              </button>
            </div>

            <button
              onClick={() => {
                setFlashcardIndex((i) => Math.min(flashcardDeck.length - 1, i + 1));
                setFlashcardFlipped(false);
                sounds.playClick();
              }}
              disabled={flashcardIndex >= flashcardDeck.length - 1}
              className="flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detailed Flag Inspection Modal */}
      {activeFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col gap-5 overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => setActiveFlag(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {activeFlag.category}
              </span>
              <h3 className="text-2xl font-black text-white mt-0.5">{activeFlag.name}</h3>
              {activeFlag.officialName !== activeFlag.name && (
                <p className="text-xs text-slate-400">{activeFlag.officialName}</p>
              )}
            </div>

            {/* High-res Scalable Flag SVG */}
            <div className="w-full h-64 rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950/80 flex items-center justify-center p-3 sm:p-4">
              <FlagImage flag={activeFlag} className="w-full h-full bg-transparent border-0" shadow={false} />
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block font-semibold">Region / Continent</span>
                <span className="text-white font-bold text-sm mt-0.5 block">
                  {activeFlag.continent}
                </span>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block font-semibold">Capital City</span>
                <span className="text-white font-bold text-sm mt-0.5 block">
                  {activeFlag.capital || 'N/A'}
                </span>
              </div>
              {activeFlag.parentCountry && (
                <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 col-span-2">
                  <span className="text-slate-400 block font-semibold">Parent Nation</span>
                  <span className="text-amber-300 font-bold text-sm mt-0.5 block">
                    {activeFlag.parentCountry}
                  </span>
                </div>
              )}
            </div>

            {/* Design Pattern Badges */}
            {activeFlag.designPatterns && activeFlag.designPatterns.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400">Design Features:</span>
                {activeFlag.designPatterns.map((pat) => (
                  <span
                    key={pat}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 capitalize"
                  >
                    {pat.replace('-', ' ')}
                  </span>
                ))}
              </div>
            )}

            {/* Trivia Fact */}
            <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl text-xs leading-relaxed text-slate-300">
              <strong className="text-amber-400 block mb-1 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Vexillology Note
              </strong>
              {activeFlag.trivia}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  handleToggleFavorite(activeFlag);
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  userStats.favorites.includes(activeFlag.id)
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <Star
                  className={`w-4 h-4 ${
                    userStats.favorites.includes(activeFlag.id)
                      ? 'fill-amber-400 text-amber-400'
                      : ''
                  }`}
                />
                <span>
                  {userStats.favorites.includes(activeFlag.id)
                    ? 'In Favorites'
                    : 'Add to Favorites'}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveFlag(null);
                  onLaunchDrill(activeFlag);
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Target className="w-4 h-4" />
                <span>Practice in Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
