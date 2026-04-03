const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Phục vụ file tĩnh (index.html)
app.use(express.static(__dirname));

// Lưu lịch sử tin nhắn (mảng đơn giản)
const MAX_MESSAGES = 1000;
let messages = [];

// Thêm tin nhắn vào lịch sử
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

// Lấy tin nhắn theo trang (mới nhất trước)
function getMessagesPage(page = 1, limit = 30) {
    const start = (page - 1) * limit;
    // Reverse để tin mới nhất lên trên khi gửi
    return messages.slice().reverse().slice(start, start + limit);
}

io.on('connection', (socket) => {
    console.log('⚡ Người dùng kết nối:', socket.id);

    // Gửi 30 tin mới nhất khi kết nối
    socket.emit('chat history', getMessagesPage(1, 30));

    socket.on('chat message', (data) => {
        addMessageToHistory(data);
        io.emit('chat message', data);   // real-time cho tất cả
    });

    // Client yêu cầu tải thêm tin cũ (infinite scroll)
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
