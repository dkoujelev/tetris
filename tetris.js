const tBlock = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
const sBlock = [[0, 1, 1], [1, 1, 0], [0, 0, 0]];
const zBlock = [[1, 1, 0], [0, 1, 1], [0, 0, 0]];
const lBlock = [[0, 0, 1], [1, 1, 1], [0, 0, 0]];
const jBlock = [[1, 0, 0], [1, 1, 1], [0, 0, 0]];
const oBlock = [[1, 1], [1, 1]];
const iBlock = [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]];

const blocks = [tBlock, sBlock, zBlock, lBlock, jBlock, oBlock, iBlock];

const random = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
};

class Player {
  constructor() {
    this.initPos = { x: 4, y: 0 };
    this.pos = { x: 4, y: 0 };
    this.block = [];
    this.nextBlock();
  }

  moveDown() {
    this.pos.y++;
  }

  moveLeft() {
    this.pos.x--;
  }

  moveRight() {
    this.pos.x++;
  }

  moveUp() {
    this.pos.y--;
  }

  nextBlock() {
    this.block = blocks[random(0, blocks.length - 1)].map(line => [...line]);
    this.resetPosition();
  }

  resetPosition() {
    this.pos = { x: this.initPos.x, y: this.initPos.y };
  }

  rotate() {
    let block = this.block;
    for (let y = 0; y < block.length; y++) {
      for (let x = 0; x < y; x++) {
        [block[x][y], block[y][x]] = [block[y][x], block[x][y]];
      }
    }

    block.forEach(row => row.reverse());
  }
}

class GameCanvas {
  constructor() {
    this.canvas = document.getElementById("tetris");
    this.context = this.canvas.getContext("2d");
    // this.context.scale(30, 30);
  }

  clearCanvas() {
    this.context.fillStyle = "#000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawArena(arena) {
    this.drawMaterix(arena, { x: 0, y: 0 });
  }

  drawBlock(player) {
    const { block, pos } = player;
    this.drawMaterix(block, pos);
  }

  drawFrame(arena, player, ghostBlock) {
    this.clearCanvas();
    this.drawArena(arena);
    this.drawBlock(player);
    this.drawGhostBlock(ghostBlock);
  }

  drawGhostBlock(ghostBlock) {
    let context = this.context;
    let { block, pos } = ghostBlock;

    block.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val !== 0) {
          context.strokeStyle = "white";
          context.strokeRect(30 * (x + pos.x), 30 * (y + pos.y), 30, 30);
        }
      });
    });
  }

  drawMaterix(block, offset) {
    let context = this.context;

    block.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val !== 0) {
          context.fillStyle = "white";
          context.fillRect(30 * (x + offset.x), 30 * (y + offset.y), 30, 30);
          context.fillStyle = "red";
          context.fillRect(
            30 * (x + offset.x) + 1,
            30 * (y + offset.y) + 1,
            28,
            28
          );
        }
      });
    });
  }
}

class Game {
  constructor(width, height) {
    this.player = new Player();
    this.canvas = new GameCanvas();
    this.level = 1;
    this.lastTime = 0;
    this.dropCounter = 0;
    this.dropInterval = 1000;
    this.width = width;
    this.height = height;
    this.linesCleared = 0;
    this.createArena(width, height);
  }

  checkCollision(p) {
    let { block, pos } = p !== undefined ? p : this.player;
    let arena = this.arena;

    for (let y = 0; y < block.length; y++) {
      for (let x = 0; x < block[y].length; x++) {
        if (
          block[y][x] !== 0 &&
          (!arena[y + pos.y] || arena[y + pos.y][x + pos.x] !== 0)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  checkGameOver() {
    if (this.player.pos.y === 0 && this.checkCollision()) {
      this.restartGame();
      return true;
    }

    return false;
  }

  clearLine(row) {
    this.arena[row] = new Array(this.arena[row].length).fill(0);
    this.linesCleared++;

    if (this.linesCleared > this.level * 5) {
      this.level++;
      this.dropInterval = 1000 * Math.pow(0.9, this.level);
    }
  }

  clearLines() {
    for (let row = 0; row < this.arena.length; row++) {
      if (!this.arena[row].includes(0)) {
        this.clearLine(row);
        this.moveLinesDown(row);
      }
    }
  }

  createArena = (width, height) => {
    this.arena = [];

    while (height--) {
      this.arena.push(new Array(width).fill(0));
    }
  };

  ghostBlock() {
    let ghost = new Player();
    ghost.pos.x = this.player.pos.x;
    ghost.block = this.player.block;

    while (!this.checkCollision(ghost)) {
      ghost.moveDown();
    }

    ghost.moveUp();

    return ghost;
  }

  hardDrop() {
    let player = this.player;

    while (!this.checkCollision()) {
      player.moveDown();
    }

    if (!this.checkGameOver()) {
      player.moveUp();
      this.merge(this.arena, player);
      player.nextBlock();
      this.dropCounter = 0;
    }
  }

  initControls() {
    document.addEventListener("keydown", e => {
      if (e.keyCode === 37) {
        // Left
        game.movePlayer(-1);
      } else if (e.keyCode === 39) {
        // Right
        game.movePlayer(1);
      } else if (e.keyCode === 40) {
        // Down
        game.softDropBlock();
        // Up
      } else if (e.keyCode === 38) {
        game.rotateBlock();
      } else if (e.keyCode === 32) {
        game.hardDrop();
      }
    });
  }

  merge() {
    let player = this.player;

    player.block.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val !== 0) {
          this.arena[y + player.pos.y][x + player.pos.x] = val;
        }
      });
    });

    this.clearLines();
    this.checkGameOver();
    player.nextBlock();
  }

  moveLinesDown(row) {
    for (let r = row; r > 0; r--) {
      this.arena[r] = [...this.arena[r - 1]];
    }

    this.arena[0] = new Array(this.arena[0].length).fill(0);
  }

  movePlayer(direction) {
    let player = this.player;
    direction > 0 ? player.moveRight() : player.moveLeft();

    if (this.checkCollision()) {
      direction > 0 ? player.moveLeft() : player.moveRight();
    }
  }

  restartGame() {
    this.createArena(this.width, this.height);
    this.player.nextBlock();
    this.lastTime = 0;
    this.dropCounter = 0;
    this.dropInterval = 1000;
    this.level = 1;
  }

  rotateBlock() {
    let player = this.player;
    player.rotate();

    let dir = 1;
    let offset = 1;

    while (this.checkCollision()) {
      for (let i = 0; i < offset; i++) {
        dir > 0 ? player.moveRight() : player.moveLeft();
      }
      offset++;
      dir *= -1;

      if (offset > 5) break;
    }
  }

  softDropBlock() {
    let player = this.player;
    player.moveDown();

    if (this.checkCollision()) {
      player.moveUp();
      this.merge(this.arena, player);
      player.nextBlock();
    }

    this.dropCounter = 0;
  }

  start() {
    this.initControls();
    this.update();
  }

  update = (time = 0) => {
    const dt = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += dt;

    if (this.dropCounter >= this.dropInterval) {
      this.softDropBlock();
    }

    this.canvas.drawFrame(this.arena, this.player, this.ghostBlock());
    window.requestAnimationFrame(this.update);
  };
}

const game = new Game(12, 20);
game.start();
