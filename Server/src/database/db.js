import { Pool } from 'pg';

// Set up your PostgreSQL connection pool
const pool = new Pool({
  user: 'your_user',
  host: 'localhost',
  database: 'your_database',
  password: 'your_db_password',
  port: 5432, // PostgreSQL port
});

export default pool;
