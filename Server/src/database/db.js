import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT || 5432,
  ssl: false,
  max: process.env.PG_MAX_CLIENTS || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

export default pool;
