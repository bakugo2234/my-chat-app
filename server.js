const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { 
        origin: "*", 
        methods: ["GET", "POST"] 
    }
});

// Phục vụ file tĩnh
app.use(express.static(__dirname));

const MAX_MESSAGES = 1000;
let messages = [];

function addMessageToHistory(data) {
    messages.push({
        ...data,
        timestamp: Date.now(),
        id: Date.now() + Math.random().toString(36)
    });

    if (messages.length > MAX_MESSAGES) {
        messages.shift();
    }
}

function getMessagesPage(page = 1, limit = 30) {
    const start = (page - 1) * limit;
    return messages.slice().reverse().slice(start, start + limit);
}

io.on('connection', (socket) => {
    console.log('⚡ Người dùng kết nối:', socket.id);

    socket.emit('chat history', getMessagesPage(1, 30));

    socket.on('chat message', (data) => {
        if (!data.user || !data.msg) return;
        addMessageToHistory(data);
        io.emit('chat message', data);
    });

    socket.on('load older messages', (page) => {
        const olderMessages = getMessagesPage(page, 30);
        socket.emit('older messages response', {
            page,
            messages: olderMessages,
            hasMore: olderMessages.length === 30
        });
    });

    socket.on('disconnect', () => {
        console.log('❌ Người dùng thoát:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server chạy tại port ${PORT}`);
});
