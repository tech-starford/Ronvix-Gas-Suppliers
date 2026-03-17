import {Pool} from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});
// Test the database connection
pool.connect()
    .then(client => {
        console.log('Connected to the database');
    })
    .catch(err => {
        console.error('Error connecting to the database', err);
    });


export default pool;