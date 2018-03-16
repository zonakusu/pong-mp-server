var io = require('socket.io')();

console.log('Starting server');

var game, gameLoop;

class PongIOEngine {
  constructor () {
    console.log(`Starting new game with ${this.noPlayers} players`);

    io.sockets.to('Gameroom').emit('NEW_GAME', {
      ball: this.createBall(),
      players: this.getPlayers()
    });

    clearTimeout(gameLoop);

    this.gameLoop();
  }

  gameLoop () {
    gameLoop = setTimeout(this.gameLoop.bind(this), 1000 / 1);

    io.sockets.to('Gameroom').emit('GAME_UPDATE', {
      players: this.players
    })
  }

  createBall () {
    return {
      y: Math.round(Math.random() * 100),
      direction: Math.round(Math.random() * 360),
      velocity: 100,
    };
  }

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

  get noPlayers () {
    return io.sockets.adapter.rooms['Gameroom'].length;
  }

  setPlayerPosition (player_id, yPos) {
    this.players[player_id].yPos = yPos;
  }
}


io.attach(5000, {
  serveClient: false,
});

io.sockets.on('connection', (socket) => {
  socket.join('Gameroom');

  let noPlayers = io.sockets.adapter.rooms['Gameroom'].length;

  // Todo alle users positie geven

  socket.broadcast.to('Gameroom').emit('NEW_PLAYER', {
    player_id: socket.id
  });

  socket.on('SET_POSITION', (data) => {
    game.setPlayerPosition(socket.id, data.yPos);
  });

  socket.on('RESTART_GAME', () => {
    game = new PongIOEngine();
  });

  socket.on('disconnect', () => {
    socket.broadcast.to('Gameroom').emit('PLAYER_LEFT', {
      player_id: socket.id
    });

    game = new PongIOEngine();
  });

  if (noPlayers >= 2) {
    game = new PongIOEngine();
  }
});
