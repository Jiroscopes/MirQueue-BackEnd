import config from '../config';
import mariadb from 'mariadb';

const pool = mariadb.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    connectionLimit: 5,
    database: config.db.database,
});

export default pool;