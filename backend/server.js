import express from 'express';

import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Example route
app.get('/', (req, res) => {
  res.send('Hello, Ronvix Gas Suppliers!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Import the database connection
import pool from './db.js';