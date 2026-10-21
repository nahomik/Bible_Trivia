import { io } from 'socket.io-client';
import fs from 'fs';

const SOCKET_URL = 'http://localhost:3001';

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const questionsPath = new URL('../src/data/questions.json', import.meta.url).pathname;
  const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

  const host = io(SOCKET_URL);
  const guest = io(SOCKET_URL);

  host.on('connect', () => console.log('[host] connected', host.id));
  guest.on('connect', () => console.log('[guest] connected', guest.id));

  host.on('room-updated', (room) => console.log('[host] room-updated', room.code, room.players.map(p => p.name)));
  guest.on('room-updated', (room) => console.log('[guest] room-updated', room.code, room.players.map(p => p.name)));

  let currentRoomCode = '';

  host.on('game-started', (room) => {
    console.log('[host] game-started', room.code);
    currentRoomCode = room.code;
    host.emit('submit-answer', { roomCode: room.code, questionIndex: 0, answer: room.questions[0].correctAnswer, timeSpent: 2 }, (res) => {
      console.log('[host] submit-answer res', res);
    });
  });

  guest.on('game-started', (room) => {
    console.log('[guest] game-started', room.code);
    currentRoomCode = room.code;
    guest.emit('submit-answer', { roomCode: room.code, questionIndex: 0, answer: room.questions[0].correctAnswer, timeSpent: 3 }, (res) => {
      console.log('[guest] submit-answer res', res);
    });
  });

  host.on('new-question', (data) => {
    console.log('[host] new-question', data.questionIndex);
    host.emit('submit-answer', { roomCode: data.roomCode || currentRoomCode, questionIndex: data.questionIndex, answer: data.question.correctAnswer, timeSpent: 2 }, (res) => {
      console.log('[host] submit-answer res', res);
    });
  });

  guest.on('new-question', (data) => {
    console.log('[guest] new-question', data.questionIndex);
    guest.emit('submit-answer', { roomCode: data.roomCode || currentRoomCode, questionIndex: data.questionIndex, answer: data.question.correctAnswer, timeSpent: 3 }, (res) => {
      console.log('[guest] submit-answer res', res);
    });
  });


  host.on('question-complete', (data) => console.log('[host] question-complete', data.questionIndex));
  guest.on('question-complete', (data) => console.log('[guest] question-complete', data.questionIndex));

  let finishResolve;
  const finishPromise = new Promise(r => { finishResolve = r; });

  host.on('game-finished', (data) => {
    console.log('[host] game-finished', data);
    finishResolve();
  });
  guest.on('game-finished', (data) => console.log('[guest] game-finished', data));

  await new Promise(r => host.once('connect', r));

  const createRes = await new Promise(resolve => host.emit('create-room', { playerName: 'Host', settings: {} }, resolve));
  console.log('[host] create-room result', createRes);
  const roomCode = createRes.roomCode;

  await new Promise(r => guest.once('connect', r));
  const joinRes = await new Promise(resolve => guest.emit('join-room', { roomCode, playerName: 'Guest' }, resolve));
  console.log('[guest] join-room result', joinRes);

  await wait(500);

  // Start game from host using first 3 questions
  const qslice = questions.slice(0, 3).map(q => ({ ...q }));
  const startRes = await new Promise(resolve => host.emit('start-game', { roomCode, questions: qslice }, resolve));
  console.log('[host] start-game result', startRes);

  // Wait for game to finish
  await Promise.race([finishPromise, wait(15000)]);

  host.disconnect();
  guest.disconnect();
  console.log('Multiplayer simulation completed successfully!');
  process.exit(0);
})();

