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
const MAX_MESSAGES = 1000;        // Tăng giới hạn lưu tạm
let messages = [];

// Hàm thêm tin nhắn
function addMessageToHistory(data) {
    messages.push({
        ...data,
        timestamp: Date.now(),
        id: Date.now() + Math.random()   // id tạm
    });

    if (messages.length > MAX_MESSAGES) {
        messages.shift();
    }
}

// Lấy tin nhắn theo phân trang (mới nhất trước)
function getMessagesPage(page = 1, limit = 50) {
    const start = (page - 1) * limit;
    // Trả về tin mới nhất trước (reverse)
    return messages.slice().reverse().slice(start, start + limit);
}

io.on('connection', (socket) => {
    console.log('⚡ Người dùng kết nối:', socket.id);

    // Gửi 50 tin nhắn mới nhất khi kết nối
    socket.emit('chat history', getMessagesPage(1, 50));

    socket.on('chat message', (data) => {
        addMessageToHistory(data);
        io.emit('chat message', data);   // real-time
    });

    // Client yêu cầu load thêm tin cũ
    socket.on('load more', (page) => {
        const olderMessages = getMessagesPage(page, 50);
        socket.emit('load more response', { page, messages: olderMessages });
    });

    socket.on('disconnect', () => {
        console.log('❌ Người dùng thoát:', socket.id);
    });
});
