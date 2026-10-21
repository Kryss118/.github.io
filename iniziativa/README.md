# Iniziativa · Il tavolo del master

Gestore in italiano dell'iniziativa di D&D 5e. Sito statico compatibile con GitHub Pages, con progetto pronto per PyCharm. Non richiede pacchetti da installare.

## Utilizzo

1. Aggiungi i giocatori indicando nome, bonus totale di iniziativa ed eventuale vantaggio/svantaggio.
2. Seleziona **Nemico**, indica nome e quantità: ogni creatura viene numerata e riceve un tiro indipendente. Massimo 100 nemici per inserimento e 200 partecipanti complessivi.
3. Premi **Genera turno**: compare il numero del turno (round), con tutti i partecipanti ordinati per iniziativa decrescente. Ogni riga mostra i dadi, il bonus e il totale. Il dado scartato è barrato.
4. **Prossimo partecipante** evidenzia chi agisce. Dopo l'ultimo, premi **Genera turno** per il round successivo.

**Modalità:** «Nuovo lancio a ogni turno» rilancia tutti i dadi ed è la variante richiesta. «Ordine fisso · D&D 5e» mantiene il primo ordine e incrementa solo il contatore, come nelle regole base. Il termine «turno» nell'interfaccia indica il round dell'intero gruppo.

**Tiri:** normale = 1d20 + bonus; vantaggio = massimo di 2d20 + bonus; svantaggio = minimo di 2d20 + bonus. Vantaggio e svantaggio insieme si annullano. Il bonus può essere negativo. Non si applicano successi/fallimenti automatici su 20 e 1.

**Parità:** inizialmente vale l'ordine di inserimento; le frecce ↑/↓ permettono al master di spostare i soli partecipanti a pari totale. Non si presume che il bonus di iniziativa coincida con la Destrezza.

Modificare/aggiungere/rimuovere partecipanti o cambiare modalità azzera i tiri e il contatore. «Termina scontro» mantiene i partecipanti per il prossimo incontro.

## Salvataggi

Lo scontro si salva automaticamente sul browser e sul dispositivo in uso, inclusi ordine, turno e partecipante attivo. Non c'è sincronizzazione tra dispositivi o una stanza multiplayer. **Esporta scontro** scarica un JSON; **Importa scontro** lo ripristina, anche su un altro dispositivo. In navigazione privata i dati potrebbero essere eliminati alla chiusura. Se il salvataggio non è disponibile appare un avviso.

## Aprire e avviare con PyCharm

1. **File → Open** e scegli questa cartella (`iniziativa-dnd`, oppure `iniziativa` nel repository).
2. Se richiesto, seleziona un interprete Python 3.9 o successivo. Non ci sono dipendenze.
3. Apri `main.py` e scegli **Run 'main'** oppure la configurazione **Iniziativa - anteprima web**.
4. Si apre `http://127.0.0.1:8000/`. Per chiudere usa il pulsante Stop di PyCharm.

In alternativa: `python main.py`. Per una porta diversa: `python main.py --port 8001`. È possibile aprire anche `index.html` direttamente in un browser moderno; per un comportamento uniforme dei salvataggi si consiglia l'anteprima locale.

Python serve esclusivamente l'anteprima locale. GitHub Pages esegue HTML, CSS e JavaScript nel browser senza server Python. I font Google sono facoltativi e hanno alternative locali.

## GitHub Pages

Destinazione: cartella `iniziativa/` del repository `Kryss118/.github.io`, branch `main`.

URL previsto con la configurazione Pages standard del repository:
https://kryss118.github.io/.github.io/iniziativa/

Se Pages non è già attivo, in GitHub apri **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save**. La cartella dell'app deve restare nella sorgente pubblicata. Un eventuale dominio personalizzato cambia l'URL.

## Verifica

I test del motore richiedono Node.js 18+ e si eseguono con `node --test tests/engine.test.cjs`. Verificano dadi, condizioni, bonus negativi, ordine, round, modalità fissa e validazione dei salvataggi. Nessuna dipendenza npm.

## File

- `index.html`, `style.css`, `favicon.svg`: interfaccia responsive.
- `engine.js`: dadi e regole, indipendenti dall'interfaccia.
- `app.js`: partecipanti, turni, spareggi, salvataggi e import/export.
- `main.py`, `.run/`: avvio locale in PyCharm.
- `tests/engine.test.cjs`: test automatici.

Strumento indipendente, non affiliato a Wizards of the Coast. Regole di riferimento: [combattimento](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/combat) e [vantaggio/svantaggio](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores).
