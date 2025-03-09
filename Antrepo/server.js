require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// API rotalarını /api altında kullan
app.use('/api', apiRoutes);

// Use SERVER_PORT from .env if available
let PORT = process.env.PORT || process.env.SERVER_PORT || 3002;
let server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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
