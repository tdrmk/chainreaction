const ROWS = 9;
const COLUMNS = 5;

// utility methods
const getpos = (index) => [Math.floor(index / COLUMNS), index % COLUMNS];
const getindex = (row, column) => row * COLUMNS + column;
const getopponent = (player) => (player + 1) % 2;

// some pre computations
const criticalmass = new Int8Array(ROWS * COLUMNS).map((_, index) => {
  const [row, column] = getpos(index);
  return 4 - [0, ROWS - 1].includes(row) - [0, COLUMNS - 1].includes(column);
});
const neighbours = [...new Array(ROWS * COLUMNS)].map((_, index) => {
  const [row, column] = getpos(index);
  return [
    ...(row > 0 ? [getindex(row - 1, column)] : []),
    ...(row < ROWS - 1 ? [getindex(row + 1, column)] : []),
    ...(column > 0 ? [getindex(row, column - 1)] : []),
    ...(column < COLUMNS - 1 ? [getindex(row, column + 1)] : []),
  ];
});

class ChainReaction {
  constructor() {
    this.masses = new Int8Array(ROWS * COLUMNS);
    this.players = new Int8Array(ROWS * COLUMNS);
    this.scores = new Int16Array(2);
    this.winner = undefined;
    this.moves = 0;
  }

  duplicate() {
    const cr = new ChainReaction();
    cr.masses.set(this.masses);
    cr.players.set(this.players);
    cr.scores.set(this.scores);
    cr.winner = this.winner;
    cr.moves = this.moves;
    return cr;
  }

  // immutable
  add(row, column, player) {
    const cr = this.duplicate();

    const index = getindex(row, column);
    const opponent = getopponent(player);

    // preconditions
    if (cr.winner) throw new Error("game over");
    if (cr.masses[index] !== 0 && cr.players[index] !== player)
      throw new Error("impossible");

    cr.masses[index] += 1;
    cr.players[index] = player;
    cr.scores[player] += 1;
    cr.moves += 1;

    if (cr.masses[index] === criticalmass[index]) {
      const critical = [index];
      do {
        const index = critical.shift();
        cr.masses[index] -= criticalmass[index];
        for (const nindex of neighbours[index]) {
          if (cr.players[nindex] === opponent) {
            cr.scores[player] += cr.masses[nindex]; // take over orbs
            cr.scores[opponent] -= cr.masses[nindex];
          }
          cr.players[nindex] = player;
          cr.masses[nindex] += 1;
          if (cr.masses[nindex] === criticalmass[nindex]) critical.push(nindex);
        }
      } while (critical.length > 0 && cr.scores[opponent] > 0);
    }

    if (cr.scores[player] > 1 && cr.scores[opponent] <= 0) cr.winner = player;

    // post conditions
    if (cr.scores[opponent] < 0) throw new Error("scores negative");
    if (cr.moves !== cr.scores[0] + cr.scores[1])
      throw new Error(`scores not matching`);

    return cr;
  }

  // AI related functionalities
  potentialmoves(player) {
    return [...new Array(ROWS * COLUMNS).keys()].filter(
      (index) => this.masses[index] === 0 || this.players[index] === player
    );
  }

  chains(player) {
    const lengths = [];
    const visitedarr = new Int8Array(ROWS * COLUMNS);
    visitedarr.forEach((visited, index) => {
      if (
        !visited &&
        this.players[index] === player &&
        this.masses[index] === criticalmass[index] - 1
      ) {
        let length = 0;
        const visiting = [index];
        do {
          const index = visiting.shift();
          visitedarr[index] = 1;
          length++;
          for (const nindex of neighbours[index]) {
            if (
              !visitedarr[nindex] &&
              this.players[nindex] === player &&
              this.masses[nindex] === criticalmass[nindex] - 1
            ) {
              visiting.push(nindex);
            }
          }
        } while (visiting.length > 0);
        lengths.push(length);
      }
    });

    return lengths;
  }

  evaluate(player) {
    const opponent = getopponent(player);
    let score = 0;
    if (this.winner === player) return 10000;
    if (this.winner === opponent) return -10000;
    this.masses.forEach((mass, index) => {
      if (mass > 0 && this.players[index] === player) {
        let criticalenemyneighbours = false;
        for (const nindex of neighbours[index]) {
          if (
            this.players[nindex] === opponent &&
            this.masses[nindex] === criticalmass[nindex] - 1
          ) {
            score -= 5 - criticalmass[index];
            criticalenemyneighbours = true;
          }
        }
        if (!criticalenemyneighbours) {
          // edge heuristic
          if (criticalmass[index] === 3) {
            score += 2;
          }
          // corner heuristic
          else if (criticalmass[index] === 2) {
            score += 3;
          }
          // unstability heuristic
          if (this.masses[index] === criticalmass[index] - 1) {
            score += 2;
          }
        }
      }
    });
    score += this.scores[player];
    this.chains(player).forEach((length) => {
      if (length > 1) score += 2 * length;
    });

    return score;
  }
}

function greedychoice(player) {
  const moves = chainreaction.potentialmoves(player);
  const scores = moves.map((index) => {
    const [row, column] = getpos(index);
    const cr = chainreaction.add(row, column, player);
    return cr.evaluate(player);
  });
  const maxscore = Math.max(...scores);
  return moves[scores.indexOf(maxscore)];
}

let chainreaction = new ChainReaction();
onmessage = (event) => {
  const { type, payload } = event.data;
  switch (type) {
    case "reset": {
      chainreaction = new ChainReaction();
      break;
    }
    case "move": {
      const { row, column, player } = payload;
      chainreaction = chainreaction.add(row, column, player);
      break;
    }
    case "choose-move": {
      const { player } = payload;
      // const index = chainreaction.potentialmoves(player)[0];
      const index = greedychoice(player);
      const [row, column] = getpos(index);
      postMessage({ type: "move", payload: { row, column } });
      break;
    }
  }
};

function prettyprint(arr) {
  for (let r = 0; r < ROWS; r++) {
    console.log(arr.slice(r * COLUMNS, (r + 1) * COLUMNS).join(" "));
  }
}
