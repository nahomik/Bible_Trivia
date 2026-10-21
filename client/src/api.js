const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.port === '5173' ? `http://${window.location.hostname}:3001/api` : '/api');

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function removeToken() {
  localStorage.removeItem('token');
}

async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

export async function register(username, email, password) {
  const data = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function login(login, password) {
  const data = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function getMe() {
  return apiCall('/auth/me');
}

export async function saveGameResult(gameData) {
  return apiCall('/game/save', {
    method: 'POST',
    body: JSON.stringify(gameData),
  });
}

export async function getGameHistory() {
  return apiCall('/game/history');
}

export async function getStats() {
  return apiCall('/game/stats');
}

export async function getLeaderboard(sortBy = 'total_score') {
  return apiCall(`/leaderboard?sortBy=${encodeURIComponent(sortBy)}`);
}

export async function updateAvatar(avatar) {
  return apiCall('/auth/avatar', {
    method: 'PUT',
    body: JSON.stringify({ avatar }),
  });
}

export function logout() {
  removeToken();
}

export function isAuthenticated() {
  return !!getToken();
}

