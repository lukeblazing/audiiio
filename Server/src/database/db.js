import { Pool } from 'pg';

// Load SSL certificate if in production environment
const sslCert = { 
  rejectUnauthorized: true,
  ca: process.env.PG_SSL_CERT
};

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT || 5432,
  ssl: sslCert,
  max: process.env.PG_MAX_CLIENTS || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
