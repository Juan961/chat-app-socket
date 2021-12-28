const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server, { 
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"]  
  }
});

const formatMessage = require('./utils/messages');

const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

io.on('connection', (socket) => {
  socket.on('joinRoom', ({username, toRoom, fromRoom}) => {

    if(fromRoom) {
      socket.leave(fromRoom);
    }
  
    const user = userJoin(socket.id, username, toRoom)

    socket.join(user.room);

    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage("BOT", `${user.username} has joined the chat`)
      );
    
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
    
  })

  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  socket.on('exit', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage("BOT", `${user.username} has left the chat`)
      );

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

server.listen(4000, '0.0.0.0', () => {  
  console.log('Server running on port 4000');
});