(() => {
  'use strict';
  const E = window.Initiative;
  const $ = id => document.getElementById(id);
  const form = $('participant-form');
  const KEY = 'tavolo-master-iniziativa-v1';
  const modeLabels = { normal: 'Normale', advantage: 'Vantaggio', disadvantage: 'Svantaggio' };
  const signed = n => n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
  let state = E.blankState();
  let editing = null;
  let toastTimer;
  let storageFailed = false;
  function toast(message) {
    $('toast').textContent = message;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5000);
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageFailed = false;
      $('save-status').textContent = '✓ Salvato su questo browser';
    } catch {
      storageFailed = true;
      $('save-status').textContent = 'Salvataggio non disponibile: esporta lo scontro per conservarlo.';
    }
  }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function iconButton(text, label, action) {
    const button = node('button', 'icon-button', text);
    button.type = 'button'; button.title = label; button.setAttribute('aria-label', label);
    button.addEventListener('click', action);
    return button;
  }
  function condition(p) {
    if (p.advantage && p.disadvantage) return 'Vantaggio e svantaggio annullati';
    return p.advantage ? 'Vantaggio' : p.disadvantage ? 'Svantaggio' : 'Tiro normale';
  }
  function avatar(p) { return node('span', `avatar ${p.kind === 'enemy' ? 'enemy' : ''}`, p.kind === 'enemy' ? '♜' : '♙'); }
  function render() {
    $('roster-count').textContent = state.participants.length;
    $('roster-empty').hidden = state.participants.length > 0;
    $('demo').hidden = state.participants.length > 0;
    $('export').disabled = !state.participants.length;
    $('roster').replaceChildren();
    for (const p of state.participants) {
      const item = node('li');
      const info = node('div', 'member-info');
      info.append(node('div', 'member-name', p.name), node('div', 'member-meta', `${signed(p.bonus)} iniziativa · ${condition(p)}`));
      item.append(avatar(p), info, iconButton('✎', `Modifica ${p.name}`, () => edit(p.id)), iconButton('×', `Rimuovi ${p.name}`, () => {
        state = E.resetCombat({ ...state, participants: state.participants.filter(other => other.id !== p.id) });
        if (editing === p.id) clearForm();
        persist(); render(); toast(`${p.name} rimosso. Contatore turni azzerato.`);
      }));
      $('roster').append(item);
    }
    $('round').textContent = state.round || '—';
    $('mode').value = state.mode;
    $('mode-help').textContent = state.mode === 'fixed' ? 'Il primo lancio stabilisce l’ordine per tutto lo scontro. Genera turno avanza il contatore.' : 'A ogni turno, un nuovo tiro per ciascun partecipante.';
    $('generate').disabled = !state.participants.length;
    $('combat-empty').hidden = state.round > 0;
    $('combat-results').hidden = !state.round;
    $('initiative-order').replaceChildren();
    state.results.forEach((r, index) => {
      const p = state.participants.find(p => p.id === r.id);
      const item = node('li', index === state.active ? 'is-active' : index < state.active ? 'is-done' : '');
      if (index === state.active) item.setAttribute('aria-current', 'step');
      const info = node('div', 'result-info');
      info.append(node('div', 'result-name', p.name), node('span', `kind-tag ${p.kind === 'enemy' ? 'enemy' : ''}`, `${p.kind === 'enemy' ? 'NEMICO' : 'GIOCATORE'}${index === state.active ? ' · IN AZIONE' : ''}`));
      const detail = node('div', 'dice-detail');
      let selected = false;
      r.rolls.forEach((die, i) => {
        if (i) detail.append(document.createTextNode(' / '));
        const kept = die === r.kept && !selected;
        detail.append(node('span', kept ? 'kept' : 'discarded', die));
        if (kept) selected = true;
      });
      detail.append(document.createTextNode(` ${signed(p.bonus)}`), node('span', 'dice-mode', p.advantage && p.disadvantage ? 'Vant. / svant. annullati' : modeLabels[r.mode]));
      const ties = node('div', 'tie-controls');
      for (const direction of [-1, 1]) {
        const other = state.results[index + direction];
        if (other && other.total === r.total) ties.append(iconButton(direction < 0 ? '↑' : '↓', `${direction < 0 ? 'Anticipa' : 'Posticipa'} ${p.name} nello spareggio`, () => {
          const activeId = state.results[state.active].id;
          [state.results[index], state.results[index + direction]] = [state.results[index + direction], state.results[index]];
          state.active = state.results.findIndex(r => r.id === activeId);
          persist(); render();
        }));
      }
      item.append(node('span', 'rank', String(index + 1).padStart(2, '0')), avatar(p), info, detail, node('strong', 'total', r.total), ties);
      $('initiative-order').append(item);
    });
    if (state.results.length) {
      const active = state.participants.find(p => p.id === state.results[state.active].id);
      $('active-label').textContent = `In azione: ${active.name}`;
      $('next').disabled = state.active === state.results.length - 1;
      $('next').textContent = state.active === state.results.length - 1 ? 'Ultimo partecipante' : 'Prossimo partecipante →';
    }
  }
  function updateForm() {
    const enemy = form.elements.kind.value === 'enemy';
    $('quantity').disabled = !enemy || !!editing;
    if (!enemy || editing) $('quantity').value = 1;
    $('quantity-help').textContent = editing ? 'Modifica un partecipante' : enemy ? 'Un tiro per ciascun nemico' : 'Un personaggio alla volta';
    $('add-button').textContent = editing ? 'Salva modifiche' : enemy ? '+ Aggiungi nemici' : '+ Aggiungi giocatore';
    $('cancel-edit').hidden = !editing;
    $('roll-help').textContent = form.elements.advantage.checked && form.elements.disadvantage.checked ? 'Vantaggio e svantaggio si annullano: un solo d20.' : form.elements.advantage.checked ? 'Due d20: si tiene il più alto, poi si aggiunge il bonus.' : form.elements.disadvantage.checked ? 'Due d20: si tiene il più basso, poi si aggiunge il bonus.' : 'Un d20 + bonus iniziativa.';
  }
  function clearForm() { editing = null; form.reset(); updateForm(); }
  function edit(id) {
    const p = state.participants.find(p => p.id === id);
    editing = id;
    form.elements.kind.value = p.kind;
    $('name').value = p.name; $('bonus').value = p.bonus;
    form.elements.advantage.checked = p.advantage;
    form.elements.disadvantage.checked = p.disadvantage;
    updateForm(); $('name').focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  form.addEventListener('change', updateForm);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const name = $('name').value.trim();
    if (!name) { toast('Inserisci un nome.'); $('name').focus(); return; }
    const kind = form.elements.kind.value;
    const quantity = kind === 'enemy' && !editing ? Number($('quantity').value) : 1;
    if (state.participants.length + (editing ? 0 : quantity) > E.MAX_PARTICIPANTS) { toast(`Puoi aggiungere al massimo ${E.MAX_PARTICIPANTS} partecipanti.`); return; }
    const base = { name, kind, bonus: Number($('bonus').value), advantage: form.elements.advantage.checked, disadvantage: form.elements.disadvantage.checked };
    let participants;
    if (editing) participants = state.participants.map(p => p.id === editing ? { ...base, id: p.id } : p);
    else {
      const usedNames = new Set(state.participants.filter(p => p.kind === kind).map(p => p.name));
      const additions = Array.from({ length: quantity }, () => {
        let candidate = name;
        if (quantity > 1 || usedNames.has(candidate)) {
          let number = 1;
          do { candidate = `${name.slice(0, 54)} ${number++}`; } while (usedNames.has(candidate));
        }
        usedNames.add(candidate);
        return { ...base, id: crypto.randomUUID(), name: candidate };
      });
      participants = [...state.participants, ...additions];
    }
    const hadRound = state.round > 0;
    state = E.resetCombat({ ...state, participants });
    clearForm(); persist(); render();
    toast(hadRound ? 'Partecipanti aggiornati. Premi Genera turno per iniziare un nuovo scontro.' : 'Partecipanti aggiunti al tavolo.');
    $('name').focus();
  });
  $('cancel-edit').addEventListener('click', clearForm);
  $('generate').addEventListener('click', () => {
    try { state = E.generateRound(state); persist(); render(); toast(`Turno ${state.round}: iniziativa pronta.`); }
    catch (error) { toast(error.message); }
  });
  $('mode').addEventListener('change', () => {
    state = E.resetCombat({ ...state, mode: $('mode').value });
    persist(); render(); toast('Modalità aggiornata. Lo scontro riparte dal turno 1.');
  });
  $('next').addEventListener('click', () => {
    if (state.active < state.results.length - 1) { state.active++; persist(); render(); }
  });
  $('reset').addEventListener('click', () => {
    if (!confirm('Terminare lo scontro e azzerare i tiri? I partecipanti verranno conservati.')) return;
    state = E.resetCombat(state); persist(); render();
  });
  $('demo').addEventListener('click', () => {
    const samples = [ ['Aramil', 'player', 3, true, false], ['Mira', 'player', 2, false, false], ['Thorin', 'player', -1, false, true], ['Goblin 1', 'enemy', 2, false, false], ['Goblin 2', 'enemy', 2, false, false], ['Capitano goblin', 'enemy', 4, false, false] ];
    state = { ...E.blankState(), participants: samples.map(([name, kind, bonus, advantage, disadvantage]) => ({ id: crypto.randomUUID(), name, kind, bonus, advantage, disadvantage })) };
    clearForm(); persist(); render(); toast('Esempio caricato. Premi Genera turno.');
  });
  $('export').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
    const link = node('a'); link.href = url; link.download = 'scontro-iniziativa.json'; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('import').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 1000000) throw new Error('File troppo grande (massimo 1 MB).');
      const imported = E.validateState(JSON.parse(await file.text()));
      if (state.participants.length && !confirm('Sostituire lo scontro attuale con quello importato?')) return;
      state = imported; clearForm(); persist(); render(); toast('Scontro importato.');
    } catch { toast('Importazione fallita: usa un file JSON esportato da questa app.'); }
    finally { event.target.value = ''; }
  });
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) state = E.validateState(JSON.parse(saved));
  } catch {
    storageFailed = true;
    $('save-status').textContent = 'Salvataggio non disponibile o dati precedenti non validi. Usa Esporta per conservare lo scontro.';
  }
  if (!storageFailed && state.participants.length) $('save-status').textContent = '✓ Scontro ripristinato da questo browser';
  updateForm(); render();
})();
