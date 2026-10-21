import { createContext, useContext, useReducer, useEffect } from 'react';
import { sound } from '../utils/audio';

const GameContext = createContext();

const initialState = {
  mode: null,
  playerName: localStorage.getItem('bible_trivia_player_name') || '',
  user: null,
  room: null,
  players: [],
  currentPlayerIndex: 0,
  questions: [],
  currentQuestionIndex: 0,
  settings: {
    questionCount: 10,
    timePerQuestion: 20,
    filters: {
      testament: 'all',
      book: 'all',
      category: 'all',
      difficulty: 'all'
    }
  },
  gameStarted: false,
  gameOver: false,
  timePerQuestion: 20,
  answers: {},
  roomCode: null,
  isHost: false,
  theme: localStorage.getItem('bible_trivia_theme') || 'dark',
  soundMuted: sound.isMuted(),

  // New features: Survival mode lives & Lifelines
  lives: 3,
  maxLives: 3,
  lifelines: {
    fiftyFifty: false,
    extraTime: false,
    hint: false
  },
  hiddenOptionIndices: [], // set by 50:50 lifeline
  showHint: false,         // set by hint lifeline
  streak: 0,
  maxStreak: 0,
  fastestCorrectTime: 999,
  achievementToast: null
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_PLAYER_NAME':
      localStorage.setItem('bible_trivia_player_name', action.payload);
      return { ...state, playerName: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'SET_ROOM':
      return { ...state, room: action.payload, players: action.payload.players || state.players };
    case 'RECORD_MULTIPLAYER_ANSWER': {
      const { questionIndex, playerId, answerData } = action.payload;
      const newAnswers = { ...state.answers };
      if (!newAnswers[questionIndex]) newAnswers[questionIndex] = {};
      newAnswers[questionIndex][playerId] = answerData;
      return { ...state, answers: newAnswers };
    }
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    case 'SET_CURRENT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: action.payload,
        hiddenOptionIndices: [],
        showHint: false
      };
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
        timePerQuestion: action.payload.timePerQuestion || state.timePerQuestion
      };
    case 'SET_FILTERS':
      return {
        ...state,
        settings: {
          ...state.settings,
          filters: { ...state.settings.filters, ...action.payload }
        }
      };
    case 'START_GAME':
      return {
        ...state,
        gameStarted: true,
        gameOver: false,
        currentQuestionIndex: 0,
        answers: {},
        lives: 3,
        streak: 0,
        maxStreak: 0,
        fastestCorrectTime: 999,
        lifelines: { fiftyFifty: false, extraTime: false, hint: false },
        hiddenOptionIndices: [],
        showHint: false
      };
    case 'USE_LIFELINE': {
      const lifelineName = action.payload.name;
      sound.playLifeline();
      if (lifelineName === 'fiftyFifty') {
        return {
          ...state,
          lifelines: { ...state.lifelines, fiftyFifty: true },
          hiddenOptionIndices: action.payload.hiddenIndices || []
        };
      }
      if (lifelineName === 'extraTime') {
        return {
          ...state,
          lifelines: { ...state.lifelines, extraTime: true }
        };
      }
      if (lifelineName === 'hint') {
        return {
          ...state,
          lifelines: { ...state.lifelines, hint: true },
          showHint: true
        };
      }
      return state;
    }
    case 'SET_GAME_OVER':
      return { ...state, gameOver: true };
    case 'RESET_FOR_REMATCH':
      return {
        ...state,
        gameStarted: false,
        gameOver: false,
        currentQuestionIndex: 0,
        answers: {},
        hiddenOptionIndices: [],
        showHint: false
      };
    case 'RECORD_ANSWER': {
      const { questionIndex, playerId, answer, isCorrect, timeSpent } = action.payload;
      const newAnswers = { ...state.answers };
      if (!newAnswers[questionIndex]) newAnswers[questionIndex] = {};
      newAnswers[questionIndex][playerId] = { answer, isCorrect, timeSpent };

      const newStreak = isCorrect ? state.streak + 1 : 0;
      const newMaxStreak = Math.max(state.maxStreak, newStreak);
      let newLives = state.lives;
      if (state.mode === 'survival' && !isCorrect) {
        newLives = Math.max(0, state.lives - 1);
      }

      let newFastestTime = state.fastestCorrectTime;
      if (isCorrect && typeof timeSpent === 'number' && timeSpent < newFastestTime) {
        newFastestTime = timeSpent;
      }

      return {
        ...state,
        answers: newAnswers,
        streak: newStreak,
        maxStreak: newMaxStreak,
        lives: newLives,
        fastestCorrectTime: newFastestTime,
        gameOver: state.mode === 'survival' && newLives <= 0 ? true : state.gameOver
      };
    }
    case 'NEXT_QUESTION': {
      if (state.mode === 'survival' && state.lives <= 0) {
        return { ...state, gameOver: true };
      }
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, gameOver: true };
      }
      return {
        ...state,
        currentQuestionIndex: nextIndex,
        hiddenOptionIndices: [],
        showHint: false
      };
    }
    case 'NEXT_PLAYER': {
      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
      return { ...state, currentPlayerIndex: nextIndex };
    }
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.payload };
    case 'SET_IS_HOST':
      return { ...state, isHost: action.payload };
    case 'TOGGLE_THEME': {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('bible_trivia_theme', newTheme);
      return { ...state, theme: newTheme };
    }
    case 'TOGGLE_SOUND': {
      const newMuted = sound.toggleMute();
      return { ...state, soundMuted: newMuted };
    }
    case 'SET_ACHIEVEMENT_TOAST':
      return { ...state, achievementToast: action.payload };
    case 'RESET_GAME':
      return {
        ...initialState,
        theme: state.theme,
        soundMuted: state.soundMuted,
        playerName: state.playerName,
        user: state.user
      };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
