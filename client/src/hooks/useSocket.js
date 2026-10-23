import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (window.location.port === '5173' ? `http://${window.location.hostname}:3001` : window.location.origin);

let sharedSocket = null;
let sharedConnected = false;
const listeners = new Set();

function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL);
    sharedSocket.on('connect', () => {
      sharedConnected = true;
      listeners.forEach(cb => cb(true));
    });
    sharedSocket.on('disconnect', () => {
      sharedConnected = false;
      listeners.forEach(cb => cb(false));
    });
  }
  return sharedSocket;
}

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(sharedConnected);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);
    setIsConnected(sharedConnected);

    const cb = (val) => setIsConnected(val);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const createRoom = (playerName, settings) => {
    return new Promise((resolve) => {
      socket.emit('create-room', { playerName, settings }, resolve);
    });
  };

  const joinRoom = (roomCode, playerName) => {
    return new Promise((resolve) => {
      socket.emit('join-room', { roomCode, playerName }, resolve);
    });
  };

  const startGame = (roomCode, questions) => {
    return new Promise((resolve) => {
      socket.emit('start-game', { roomCode, questions }, resolve);
    });
  };

  const submitAnswer = (roomCode, questionIndex, answer, timeSpent) => {
    return new Promise((resolve) => {
      socket.emit('submit-answer', { roomCode, questionIndex, answer, timeSpent }, resolve);
    });
  };

  const nextQuestion = (roomCode) => {
    socket.emit('next-question', { roomCode });
  };

  const rematchRoom = (roomCode) => {
    return new Promise((resolve) => {
      socket.emit('rematch-room', { roomCode }, resolve);
    });
  };

  const getRoom = (roomCode) => {
    return new Promise((resolve) => {
      socket.emit('get-room', { roomCode }, resolve);
    });
  };

  const updateRoomSettings = (roomCode, settings) => {
    return new Promise((resolve) => {
      socket.emit('update-room-settings', { roomCode, settings }, resolve);
    });
  };

  return {
    socket,
    isConnected,
    createRoom,
    joinRoom,
    startGame,
    submitAnswer,
    nextQuestion,
    rematchRoom,
    getRoom,
    updateRoomSettings
  };
}

