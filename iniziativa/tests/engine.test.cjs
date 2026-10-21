const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');
const p = (changes = {}) => ({ id: 'a', name: 'Eroe', kind: 'player', bonus: 3, advantage: false, disadvantage: false, ...changes });
const sequence = (...values) => { let i = 0; return () => { assert.ok(i < values.length, 'Troppi dadi lanciati'); return values[i++]; }; };

test('tiro normale e bonus negativo, 1 e 20 senza effetti speciali', () => {
  assert.equal(E.roll(p(), sequence(20)).total, 23);
  assert.equal(E.roll(p({ bonus: -4 }), sequence(1)).total, -3);
});
test('vantaggio tiene il maggiore, svantaggio il minore', () => {
  assert.deepEqual(E.roll(p({ advantage: true }), sequence(3, 18)), { id: 'a', rolls: [3, 18], kept: 18, total: 21, mode: 'advantage' });
  assert.equal(E.roll(p({ disadvantage: true }), sequence(18, 3)).total, 6);
  assert.equal(E.roll(p({ advantage: true }), sequence(11, 11)).kept, 11);
});
test('vantaggio e svantaggio si annullano con un solo dado', () => {
  assert.deepEqual(E.roll(p({ advantage: true, disadvantage: true }), sequence(9)).rolls, [9]);
});
test('ogni creatura tira, ordine decrescente e parità stabile', () => {
  const state = { ...E.blankState(), participants: [p(), p({ id: 'b', kind: 'enemy' }), p({ id: 'c', kind: 'enemy', bonus: -2 })] };
  const next = E.generateRound(state, sequence(5, 5, 20));
  assert.deepEqual(next.results.map(r => r.id), ['c', 'a', 'b']);
  assert.equal(next.round, 1); assert.equal(state.round, 0);
  assert.deepEqual(next.results.map(r => r.total), [18, 8, 8]);
});
test('nuovo lancio a ogni round, ripartenza dal primo partecipante', () => {
  const first = E.generateRound({ ...E.blankState(), participants: [p()] }, sequence(5));
  const second = E.generateRound(first, sequence(17));
  assert.equal(second.round, 2); assert.equal(second.results[0].total, 20); assert.equal(second.active, 0);
});
test('modalità fissa preserva tiri e spareggi senza lanciare dadi', () => {
  const first = E.generateRound({ ...E.blankState(), mode: 'fixed', participants: [p(), p({ id: 'b' })] }, sequence(7, 7));
  first.results.reverse(); first.active = 1;
  const second = E.generateRound(first, () => { throw Error('Non deve rilanciare'); });
  assert.deepEqual(second.results, first.results); assert.equal(second.round, 2); assert.equal(second.active, 0);
});
test('nessun partecipante, dado invalido', () => {
  assert.throws(() => E.generateRound(E.blankState()));
  assert.throws(() => E.roll(p(), () => 21));
});
test('salvataggi e ripristino mantengono lo stato, reset conserva il gruppo', () => {
  const state = E.generateRound({ ...E.blankState(), participants: [p({ advantage: true })] }, sequence(1, 20));
  assert.deepEqual(E.validateState(JSON.parse(JSON.stringify(state))), state);
  const reset = E.resetCombat(state);
  assert.equal(reset.participants.length, 1); assert.equal(reset.round, 0); assert.deepEqual(reset.results, []);
  assert.deepEqual(E.validateState(reset), reset);
});
test('rifiuta file corrotti, duplicati, risultati inventati, indici fuori limite', () => {
  const state = E.generateRound({ ...E.blankState(), participants: [p()] }, sequence(10));
  assert.throws(() => E.validateState(null));
  assert.throws(() => E.validateState({ ...state, version: 2 }));
  assert.throws(() => E.validateState({ ...state, active: 1 }));
  assert.throws(() => E.validateState({ ...state, participants: [p(), p()] }));
  assert.throws(() => E.validateState({ ...state, results: [{ ...state.results[0], total: 100 }] }));
  assert.throws(() => E.validateState({ ...state, results: [{ ...state.results[0], rolls: [] }] }));
  assert.throws(() => E.validateState({ ...state, participants: [p({ bonus: 1.5 })] }));
});
test('rifiuta ordine crescente e stato attivo senza partecipanti', () => {
  const state = E.generateRound({ ...E.blankState(), participants: [p(), p({ id: 'b' })] }, sequence(1, 20));
  assert.throws(() => E.validateState({ ...state, results: [...state.results].reverse() }));
  assert.throws(() => E.validateState({ ...E.blankState(), round: 1 }));
});
test('dado casuale rimane tra 1 e 20', () => {
  for (let i = 0; i < 2000; i++) { const n = E.d20(); assert.ok(Number.isInteger(n) && n >= 1 && n <= 20); }
});
