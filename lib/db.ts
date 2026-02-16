import { Pool } from 'pg';

// 1. Extend the global interface so TypeScript knows 'pool' exists
declare global {
    var pool: Pool | undefined;
}

let pool: Pool;

// 2. Your logic remains the same, but now type-safe
if (!global.pool) {
    global.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Neon
    });
}

// 3. Assign the global instance to the local variable
// (We cast as Pool to guarantee it's not undefined)
pool = global.pool as Pool;

export default pool;