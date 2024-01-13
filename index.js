const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const PORT = process.env.PORT || 8001;
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*'
    }
});

// User data
const users = {};

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('login', (userData) => {
        const { username, secretCode } = userData;

        if (secretCode === 'apoorvSecretCode' && !users['Apoorv']) {
            users['Apoorv'] = socket.id;
            socket.join('Apoorv-room');
            socket.emit('loginSuccess', 'Apoorv');
        } else if (secretCode === 'asthaSecretCode' && !users['Astha']) {
            users['Astha'] = socket.id;
            socket.join('Astha-room');
            socket.emit('loginSuccess', 'Astha');
        } else {
            socket.emit('loginFailure', 'Invalid credentials or user already logged in.');
        }
    });

    socket.on('message', (data) => {
        const { from, to, message } = data;
        const targetRoom = `${from}-room`; // Form a room name based on the sender

        if (to && users[to]) {
            io.to(users[to]).emit('message', { from, message });
        } else {
            socket.emit('messageFailure', 'Invalid recipient or user not found.');
        }
    });

    socket.on('disconnect', () => {
        // Handle user disconnect and cleanup
        const username = Object.keys(users).find(key => users[key] === socket.id);
        if (username) {
            delete users[username];
            console.log(`${username} disconnected`);
        }
    });
});

server.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log('Server running on Port ', PORT);
});
