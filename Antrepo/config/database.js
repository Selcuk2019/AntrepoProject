// database.js
require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

// Debug için bağlantı detaylarını yazdıralım
console.log('Database connection config loaded');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'antrepo_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection()
    .then(conn => {
        console.log('Database connection successful');
        conn.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

module.exports = pool;
