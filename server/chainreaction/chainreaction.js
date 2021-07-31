class ChainReaction {
  constructor({ rows, columns }, players) {
    this.rows = rows;
    this.columns = columns;
    this.players = players;

    this.cells = initcells(rows, columns);
    // initial turn set to the first active player
    this.turn = players.findIndex((player) => player.active);
    this.moves = [];
    this.winner = null;

    // keeps track whether player moved or not
    this.moved = [...new Array(this.players.length)].map(() => false);
  }

  add(player, { row, column }) {
    const cell = this.cells[row]?.[column];
    const turn = this.players.findIndex((p) => p === player);

    if (this.gameover) throw new Error("game is over");
    if (!cell) throw new Error("invalid cell");
    if (this.turn !== turn) throw new Error("wait for your turn");
    if (cell.mass !== 0 && cell.player !== turn)
      throw new Error("opponent cell");

    this.moved[turn] = true;
    cell.player = turn;
    cell.mass += 1;
    this.moves.push({ row, column, turn });

    if (cell.mass === cell.criticalmass) this.triggerchainreaction(row, column);

    this.nextturn();
  }

  triggerchainreaction(row, column) {
    const critical = [{ row, column }];
    do {
      const { row, column } = critical.shift();
      const cell = this.cells[row][column];
      cell.mass -= cell.criticalmass;
      const neighbours = this.neighbours(row, column);
      for (const { row, column } of neighbours) {
        const neighbour = this.cells[row][column];
        neighbour.player = this.turn;
        neighbour.mass += 1;
        if (neighbour.mass === neighbour.criticalmass)
          critical.push({ row, column });
      }
    } while (critical.length > 0 && this.totalmass > this.mass(this.turn));
  }

  nextturn() {
    if (this.gameover) return;
    for (let i = 1; i < this.players.length; i++) {
      const turn = (this.turn + i) % this.players.length;
      if (this.eliminated(turn) || !this.players[turn].active) continue;
      this.turn = turn;
      return;
    }
    // if no other players who can play
    this.winner = this.turn;
    return;
  }

  handleplayerstateupdate() {
    if (this.gameover) return;
    const playerswithmove = this.players.filter(
      (player, turn) => player.active && !this.eliminated(turn)
    ).length;

    if (playerswithmove === 0) this.winner = this.turn;
    else if (playerswithmove === 1)
      this.winner = this.players.findIndex(
        (player, turn) => player.active && !this.eliminated(turn)
      );
    else if (!this.players[this.turn].active) this.nextturn();
  }

  // ----- utilities ------
  eliminated(turn) {
    // wait for at least one move before eliminating player
    const moved = this.moved[turn];
    const hasmass = this.mass(turn);
    return moved && !hasmass;
  }

  mass(turn) {
    return this.cells.reduce(
      (mass, cells) =>
        cells.reduce(
          (mass, cell) => mass + (cell.player === turn ? cell.mass : 0),
          mass
        ),
      0
    );
  }

  neighbours(row, column) {
    return [
      ...(row > 0 ? [{ row: row - 1, column }] : []),
      ...(row < this.rows - 1 ? [{ row: row + 1, column }] : []),
      ...(column > 0 ? [{ row, column: column - 1 }] : []),
      ...(column < this.columns - 1 ? [{ row, column: column + 1 }] : []),
    ];
  }

  // ------  getters ------
  get gameover() {
    return Number.isInteger(this.winner);
  }

  get totalmass() {
    return this.moves.length;
  }
}

function initcells(rows, columns) {
  const criticalmass = (rows, columns, row, column) =>
    4 - [0, rows - 1].includes(row) - [0, columns - 1].includes(column);

  return [...new Array(rows).keys()].map((row) =>
    [...new Array(columns).keys()].map((column) => ({
      player: 0,
      mass: 0,
      criticalmass: criticalmass(rows, columns, row, column),
    }))
  );
}

module.exports = ChainReaction;
