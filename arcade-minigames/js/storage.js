/**
 * ArcadeStorage - Manages persistent local high scores with localStorage and Cookie fallback.
 * Emits global events when high scores change so the UI refreshes instantly.
 */
const ArcadeStorage = (() => {
  const PREFIX = 'pocket_arcade_';

  // Cookie helpers for fallback
  const setCookie = (name, value, days = 365) => {
    try {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn('Cookie save failed:', e);
    }
  };

  const getCookie = (name) => {
    try {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    } catch (e) {
      return null;
    }
  };

  const isLocalStorageAvailable = () => {
    try {
      const test = '__arcade_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  };

  const hasLocalStorage = isLocalStorageAvailable();

  /**
   * Retrieves high score for a game ID
   * @param {string} gameId
   * @returns {number}
   */
  const getHighScore = (gameId) => {
    const key = `${PREFIX}hiscore_${gameId}`;
    let val = null;

    if (hasLocalStorage) {
      val = localStorage.getItem(key);
    }
    if (val === null) {
      val = getCookie(key);
    }

    const num = parseInt(val, 10);
    return isNaN(num) ? 0 : num;
  };

  /**
   * Saves a score if it exceeds the previous high score
   * @param {string} gameId
   * @param {number} score
   * @returns {{isNewRecord: boolean, previousHigh: number, current: number}}
   */
  const saveScore = (gameId, score) => {
    const currentHigh = getHighScore(gameId);
    const numericScore = Math.max(0, parseInt(score, 10) || 0);
    const isNewRecord = numericScore > currentHigh;

    if (isNewRecord) {
      const key = `${PREFIX}hiscore_${gameId}`;
      if (hasLocalStorage) {
        try {
          localStorage.setItem(key, numericScore.toString());
        } catch (e) {
          console.warn('LocalStorage error:', e);
        }
      }
      // Also sync to cookie for cross-session redundancy
      setCookie(key, numericScore.toString(), 365);

      // Dispatch event to inform UI
      window.dispatchEvent(new CustomEvent('arcade:score_updated', {
        detail: { gameId, score: numericScore, previousHigh: currentHigh }
      }));
    }

    return {
      isNewRecord,
      previousHigh: currentHigh,
      current: isNewRecord ? numericScore : currentHigh
    };
  };

  /**
   * Returns a map of all known game high scores
   * @param {string[]} gameIds
   */
  const getAllHighScores = (gameIds = []) => {
    const scores = {};
    gameIds.forEach(id => {
      scores[id] = getHighScore(id);
    });
    return scores;
  };

  /**
   * Calculates total cumulative score across all games
   * @param {string[]} gameIds
   */
  const getCumulativeScore = (gameIds = []) => {
    return gameIds.reduce((sum, id) => sum + getHighScore(id), 0);
  };

  /**
   * Clears high scores
   * @param {string[]} gameIds
   */
  const clearAllScores = (gameIds = []) => {
    gameIds.forEach(id => {
      const key = `${PREFIX}hiscore_${gameId}`;
      if (hasLocalStorage) localStorage.removeItem(key);
      setCookie(key, '', -1);
    });
    window.dispatchEvent(new CustomEvent('arcade:scores_cleared'));
  };

  // Preference helpers (Sound, CRT effect)
  const getPref = (name, fallback) => {
    const key = `${PREFIX}pref_${name}`;
    let val = hasLocalStorage ? localStorage.getItem(key) : getCookie(key);
    return val !== null ? JSON.parse(val) : fallback;
  };

  const setPref = (name, val) => {
    const key = `${PREFIX}pref_${name}`;
    const str = JSON.stringify(val);
    if (hasLocalStorage) localStorage.setItem(key, str);
    setCookie(key, str, 365);
  };

  return {
    getHighScore,
    saveScore,
    getAllHighScores,
    getCumulativeScore,
    clearAllScores,
    getPref,
    setPref
  };
})();
