var io = require('socket.io')();

/**
 * Game globals
 */
var game, gameLoop;

/**
 * PongIOEngine
 *
 * @class
 */
class PongIOEngine {

  /**
   * constructor
   */
  constructor () {
    console.log(`Starting new game with ${this.noPlayers} players`);

    io.sockets.to('Gameroom').emit('NEW_GAME', {
      ball: this.createBall(),
      players: this.getPlayers()
    });

    clearTimeout(gameLoop);

    this.gameLoop();
  }

  /**
   * gameLoop
   *
   * Gameloop, sends updates to all players every x ms. Currently hardcoded to
   * every 1000ms.
   */
  gameLoop () {
    gameLoop = setTimeout(this.gameLoop.bind(this), 1000 / 1);

    io.sockets.to('Gameroom').emit('GAME_UPDATE', {
      players: this.players
    })
  }

  /**
   * createBall
    *
   * Create ball object for init of gameLoop
   *
   * @return {Object}
   */
  createBall () {
    return {
      y: Math.round(Math.random() * 100),
      direction: Math.round(Math.random() * 360),
      velocity: 100,
    };
  }

  /**
   * getPlayers
   *
   * @return {Object}
   */
  getPlayers () {
    this.players = {};
    let playerLength = 0;

    for (let socket in io.sockets.adapter.rooms['Gameroom'].sockets) {
        this.players[socket] = {
          player_id: socket,
          team: playerLength++ % 2 ? 'RIGHT' : 'LEFT',
          height: 10,
          yPos: 50,
        };
    }

    return this.players;
  }

  /**
   * noPlayers
   *
   * @return {Number}
   */
  get noPlayers () {
    return io.sockets.adapter.rooms['Gameroom'].length;
  }

  /**
   * setPlayerPosition
   *
   * @param {String} player_id
   * @param {Number} yPos
   */
  setPlayerPosition (player_id, yPos) {
    this.players[player_id].yPos = yPos;
  }
}

// Attack to port 5000
io.attach(5000, {
  serveClient: false,
});

// Very new connection
io.sockets.on('connection', (socket) => {

  // Join room
  socket.join('Gameroom');

  let noPlayers = io.sockets.adapter.rooms['Gameroom'].length;

  // socket.broadcast.to('Gameroom').emit('NEW_PLAYER', {
  //   player_id: socket.id
  // });

  // Set position
  socket.on('SET_POSITION', (data) => {
    game.setPlayerPosition(socket.id, data.yPos);
  });

  // When user scored a point?
  socket.on('RESTART_GAME', () => {
    game = new PongIOEngine();
  });

  // On disconnect start new game
  socket.on('disconnect', () => {
    socket.broadcast.to('Gameroom').emit('PLAYER_LEFT', {
      player_id: socket.id
    });

    game = new PongIOEngine();
  });

  // Only start when at least 2 players
  if (noPlayers >= 2) {
    game = new PongIOEngine();
  }
});
