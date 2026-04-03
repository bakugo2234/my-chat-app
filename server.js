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
let messages = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('⚡ Người dùng kết nối:', socket.id);

    // Gửi toàn bộ lịch sử tin nhắn cho người mới kết nối
    socket.emit('chat history', messages);

    // Nhận tin nhắn mới từ client
    socket.on('chat message', (data) => {
        console.log(`Tin nhắn từ ${data.user}: ${data.msg}`);

        // Lưu vào lịch sử
        messages.push(data);

        // Giới hạn số tin nhắn (tránh chiếm quá nhiều RAM) - giữ tối đa 200 tin
        if (messages.length > 200) {
            messages.shift(); // xóa tin cũ nhất
        }

        // Phát tin nhắn mới cho TẤT CẢ mọi người (bao gồm người gửi)
        io.emit('chat message', data);
    });

    socket.on('disconnect', () => {
        console.log('❌ Người dùng thoát:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server chạy tại port ${PORT}`);
});
