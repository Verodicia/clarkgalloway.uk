import React, { useState, useMemo } from 'react';
import { Flag, GameMode, GameScope, DifficultyFilter, UserStats } from './types';
import { ALL_FLAGS, filterFlags, getStoredStats, saveStoredStats } from './utils/flags';
import { sounds } from './utils/sound';
import { SplashScreen } from './components/SplashScreen';
import { MainMenu } from './components/MainMenu';
import { GameSetupPage } from './components/GameSetupPage';
import { Header } from './components/Header';
import { StatsModal } from './components/StatsModal';
import { QuizMode } from './components/modes/QuizMode';
import { TypeMode } from './components/modes/TypeMode';
import { BlitzMode } from './components/modes/BlitzMode';
import { MemoryMode } from './components/modes/MemoryMode';
import { ZoomMode } from './components/modes/ZoomMode';
import { StreakMode } from './components/modes/StreakMode';
import { ColorMode } from './components/modes/ColorMode';
import { FlagLibrary } from './components/modes/FlagLibrary';

type ScreenState = 'splash' | 'menu' | 'setup' | 'game';

export function App() {
  const [screenState, setScreenState] = useState<ScreenState>('splash');
  const [currentMode, setCurrentMode] = useState<GameMode>('quiz');
  const [currentScopes, setCurrentScopes] = useState<GameScope[]>([]);
  const [roundCount, setRoundCount] = useState<number | 'all'>(10);
  const [quizDirection, setQuizDirection] = useState<'flag-to-name' | 'name-to-flag'>('flag-to-name');
  const [userStats, setUserStats] = useState<UserStats>(getStoredStats());
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);
  const [statsOpen, setStatsOpen] = useState(false);
  const [drillFlag, setDrillFlag] = useState<Flag | null>(null);

  // Sound toggle handler
  const handleToggleSound = () => {
    const nextState = sounds.toggle();
    setSoundEnabled(nextState);
  };

  // Reset user stats
  const handleResetStats = () => {
    const emptyStats: UserStats = {
      gamesPlayed: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      bestStreak: 0,
      highScores: {},
      favorites: [],
    };
    setUserStats(emptyStats);
    saveStoredStats(emptyStats);
  };

  // Launch drill from Flag Library
  const handleLaunchDrill = (flag: Flag) => {
    setDrillFlag(flag);
    setCurrentMode('quiz');
    setScreenState('game');
  };

  // Start from splash screen into main menu
  const handleStartFromSplash = () => {
    setScreenState('menu');
  };

  // Select game mode from main menu
  const handleSelectModeFromMenu = (mode: GameMode) => {
    setCurrentMode(mode);
    setDrillFlag(null);
    setCurrentScopes([]);
    if (mode === 'library') {
      // Library opens directly as an encyclopedia
      setScreenState('game');
    } else {
      // Game modes go through the intermediary pre-game difficulty setup page!
      setScreenState('setup');
    }
  };

  // Start active game after configuring in setup page
  const handleStartGameFromSetup = () => {
    setScreenState('game');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* 1. Intro Splash Screen */}
      {screenState === 'splash' && (
        <SplashScreen
          allFlags={ALL_FLAGS}
          onStart={handleStartFromSplash}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Main Container for Menu, Setup, or Game */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 flex-1">
        {/* 2. Video Game Style Main Menu */}
        {screenState === 'menu' && (
          <MainMenu
            onSelectMode={handleSelectModeFromMenu}
            userStats={userStats}
            onOpenStats={() => setStatsOpen(true)}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onResetStats={handleResetStats}
            onBackToSplash={() => setScreenState('splash')}
            allFlags={ALL_FLAGS}
          />
        )}

        {/* 3. Intermediary Pre-Game Setup Page (Multi-pool selection) */}
        {screenState === 'setup' && (
          <GameSetupPage
            mode={currentMode}
            currentScopes={currentScopes}
            onScopesChange={setCurrentScopes}
            roundCount={roundCount}
            onRoundCountChange={setRoundCount}
            quizDirection={quizDirection}
            onQuizDirectionChange={setQuizDirection}
            onStartGame={handleStartGameFromSetup}
            onBackToMenu={() => setScreenState('menu')}
            userStats={userStats}
            allFlags={ALL_FLAGS}
          />
        )}

        {/* 4. Active Game Screen (Focused Pure Gameplay) */}
        {screenState === 'game' && (
          <>
            {/* Focused In-Game Header: Mode info & Main Menu button with leave confirmation */}
            <Header
              currentMode={currentMode}
              currentScope={currentScopes}
              onReturnToMenu={() => setScreenState('menu')}
            />

            {/* Active Game Mode (Clean, focused view without scope selector clutter) */}
            <main className="w-full">
              {currentMode === 'quiz' && (
                <QuizMode
                  allFlags={ALL_FLAGS}
                  scope={currentScopes}
                  userStats={userStats}
                  onUpdateStats={setUserStats}
                  drillFlag={drillFlag}
                  onClearDrill={() => setDrillFlag(null)}
                  roundCount={roundCount}
                  quizDirection={quizDirection}
                  onPlayAgain={() => setScreenState('setup')}
                />
              )}

              {currentMode === 'type' && (
                <TypeMode
                  allFlags={ALL_FLAGS}
                  scope={currentScopes}
                  userStats={userStats}
                  onUpdateStats={setUserStats}
                  roundCount={roundCount}
                />
              )}

              {currentMode === 'blitz' && (
                <BlitzMode
                  allFlags={ALL_FLAGS}
                  scope={currentScopes}
                  userStats={userStats}
                  onUpdateStats={setUserStats}
                />
              )}

              {currentMode === 'memory' && (
                <MemoryMode
                  allFlags={ALL_FLAGS}
                  scope={currentScopes}
                  userStats={userStats}
                  onUpdateStats={setUserStats}
                />
              )}

              {currentMode === 'zoom' && (
                <ZoomMode
                  allFlags={ALL_FLAGS}
                  scope={currentScopes}
                  userStats={userStats}
                  onUpdateStats={setUserStats}
                  roundCount={roundCount}
                />
              )}

              {currentMode === 'streak' && (
                <StreakMode
                  allFlags={ALL_FLAGS}
                  scope={currentScopes}
                  userStats={userStats}
                  onUpdateStats={setUserStats}
                />
              )}

              {currentMode === 'color' && (
                <ColorMode
                  allFlags={ALL_FLAGS}
                  scope={currentScopes}
                  userStats={userStats}
                  onUpdateStats={setUserStats}
                  roundCount={roundCount}
                />
              )}

              {currentMode === 'library' && (
                <FlagLibrary
                  allFlags={ALL_FLAGS}
                  userStats={userStats}
                  onUpdateStats={setUserStats}
                  onLaunchDrill={handleLaunchDrill}
                />
              )}
            </main>
          </>
        )}
      </div>



      {/* Stats & Records Modal */}
      {statsOpen && (
        <StatsModal
          stats={userStats}
          onClose={() => setStatsOpen(false)}
          onResetStats={handleResetStats}
        />
      )}
    </div>
  );
}
export default App;
