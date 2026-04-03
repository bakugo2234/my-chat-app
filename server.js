const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",        // tạm thời cho phép tất cả (sau có thể giới hạn)
        methods: ["GET", "POST"]
    }
});

// Phục vụ file tĩnh (index.html)
app.use(express.static(__dirname));   // quan trọng: phục vụ index.html

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('⚡ Người dùng kết nối:', socket.id);

    socket.on('chat message', (data) => {
        console.log(`Tin nhắn từ ${data.user}: ${data.msg}`);
        io.emit('chat message', data);   // broadcast cho tất cả
    });

    socket.on('disconnect', () => {
        console.log('❌ Người dùng thoát');
    });
});

const PORT = process.env.PORT || 3000;   // Render sẽ cung cấp PORT
server.listen(PORT, () => {
    console.log(`🚀 Server chạy tại port ${PORT}`);
});
