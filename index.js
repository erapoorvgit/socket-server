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

        if (!users[username]) {
            users[username] = [socket.id];
            socket.join(`${username}-room`);
            socket.emit('loginSuccess', username);
        } else if (!users[username].includes(socket.id)) {
            users[username].push(socket.id);
            socket.join(`${username}-room`);
            socket.emit('loginSuccess', username);
        } else {
            socket.emit('loginFailure', 'Invalid credentials or user already logged in.');
        }
    });

    socket.on('message', (data) => {
        const { from, to, message } = data;
        const targetRoom = `${to}-room`; // Form a room name based on the recipient

        if (to && users[to] && users[to].includes(socket.id)) {
            io.to(targetRoom).emit('message', { from, message });
        } else {
            socket.emit('messageFailure', 'Invalid recipient or user not found.');
        }
    });

    socket.on('disconnect', () => {
        // Handle user disconnect and cleanup
        const username = Object.keys(users).find(key => users[key].includes(socket.id));

        if (username) {
            users[username] = users[username].filter(id => id !== socket.id);

            if (users[username].length === 0) {
                delete users[username];
                console.log(`${username} disconnected`);
            }
        }
    });
});

server.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log('Server running on Port ', PORT);
});
