/* Motore indipendente dall'interfaccia, utilizzabile anche nei test Node. */
(function (root) {
  'use strict';
  const MAX_PARTICIPANTS = 200;
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  function d20() {
    // Rejection sampling: nessuna distorsione dovuta all'operazione modulo.
    const buffer = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / 20) * 20;
    do { globalThis.crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
    return buffer[0] % 20 + 1;
  }
  function roll(participant, dice = d20) {
    const mode = participant.advantage === participant.disadvantage ? 'normal' : participant.advantage ? 'advantage' : 'disadvantage';
    const rolls = [dice()];
    if (mode !== 'normal') rolls.push(dice());
    if (!rolls.every(n => integer(n, 1, 20))) throw new Error('Dado non valido.');
    const kept = mode === 'disadvantage' ? Math.min(...rolls) : Math.max(...rolls);
    return { id: participant.id, rolls, kept, total: kept + participant.bonus, mode };
  }
  function generateRound(state, dice = d20) {
    if (!state.participants.length) throw new Error('Aggiungi almeno un partecipante.');
    const results = state.mode === 'fixed' && state.round > 0 ? state.results.map(r => ({ ...r, rolls: [...r.rolls] })) : state.participants.map(p => roll(p, dice)).sort((a, b) => b.total - a.total);
    return { ...state, round: state.round + 1, active: 0, results };
  }
  function blankState() { return { version: 1, participants: [], mode: 'reroll', round: 0, active: 0, results: [] }; }
  function resetCombat(state) { return { ...state, round: 0, active: 0, results: [] }; }
  function validateState(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.participants) || value.participants.length > MAX_PARTICIPANTS || !['fixed', 'reroll'].includes(value.mode) || !integer(value.round, 0, 1000000) || !Array.isArray(value.results) || !integer(value.active, 0, MAX_PARTICIPANTS)) throw new Error('File scontro non valido o versione non supportata.');
    const ids = new Set();
    const participants = value.participants.map(p => {
      if (!p || typeof p.id !== 'string' || !p.id || p.id.length > 100 || ids.has(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 60 || !['player', 'enemy'].includes(p.kind) || !integer(p.bonus, -99, 99) || typeof p.advantage !== 'boolean' || typeof p.disadvantage !== 'boolean') throw new Error('Partecipanti non validi.');
      ids.add(p.id);
      return { id: p.id, name: p.name.trim(), kind: p.kind, bonus: p.bonus, advantage: p.advantage, disadvantage: p.disadvantage };
    });
    const seen = new Set();
    const results = value.results.map(r => {
      if (!r || !ids.has(r.id) || seen.has(r.id) || !Array.isArray(r.rolls) || !r.rolls.every(n => integer(n, 1, 20))) throw new Error('Risultati non validi.');
      seen.add(r.id);
      const p = participants.find(p => p.id === r.id);
      const mode = p.advantage === p.disadvantage ? 'normal' : p.advantage ? 'advantage' : 'disadvantage';
      const kept = mode === 'disadvantage' ? Math.min(...r.rolls) : Math.max(...r.rolls);
      if (r.mode !== mode || r.rolls.length !== (mode === 'normal' ? 1 : 2) || r.kept !== kept || r.total !== kept + p.bonus) throw new Error('Tiri o bonus non validi.');
      return { id: r.id, mode, rolls: [...r.rolls], kept, total: r.total };
    });
    if ((value.round === 0 && (results.length || value.active !== 0)) || (value.round > 0 && (!participants.length || results.length !== participants.length || value.active >= results.length)) || results.some((r, i) => i && results[i - 1].total < r.total)) throw new Error('Ordine di iniziativa non valido.');
    return { version: 1, participants, mode: value.mode, round: value.round, active: value.active, results };
  }
  const api = { MAX_PARTICIPANTS, d20, roll, generateRound, blankState, resetCombat, validateState };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Initiative = api;
})(globalThis);
