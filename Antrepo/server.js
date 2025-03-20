/***** server.js *****/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const basicAuth = require('express-basic-auth');

const app = express();

// Örnek environment variables (.env veya Render Environment sekmesi):
// BASIC_USER_1, BASIC_PASS_1
// BASIC_USER_2, BASIC_PASS_2

// Fallback değerler:
const userOne = process.env.BASIC_USER_1 || 'admin';
const passOne = process.env.BASIC_PASS_1 || 'secret123';
const userTwo = process.env.BASIC_USER_2 || 'demo';
const passTwo = process.env.BASIC_PASS_2 || 'demo123';

// İki kullanıcının bilgilerini nesneye ekleyelim:
const users = {
  [userOne]: passOne,
  [userTwo]: passTwo
};

// 1) Önce CORS
app.use(cors({
  origin: '*', // Veya spesifik domain(ler): ['https://your-render-app.onrender.com', 'http://localhost:3002']
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Authorization header'a izin ver
  credentials: true
}));

// 2) Sonra Basic Auth
app.use(basicAuth({
  users: users,
  challenge: true,            // Tarayıcıya Basic Auth penceresi açtırır
  realm: 'My Protected Zone'  // (Opsiyonel) Basic Auth penceresinin başlığı
}));

// 3) Diğer Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// 4) API rotalarını /api altında kullan
app.use('/api', apiRoutes);

// 5) Port ayarları
let PORT = process.env.PORT || process.env.SERVER_PORT || 3002;
let server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 6) Port meşgulse otomatik farklı port bulma
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use, trying a different port...`);
    server.close(() => {
      server = app.listen(0, () => {
        PORT = server.address().port;
        console.log(`Server running on port ${PORT}`);
      });
    });
  } else {
    console.error('Server error:', err);
  }
});
