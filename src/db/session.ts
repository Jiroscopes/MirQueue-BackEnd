import pool from './index';

export const saveSessionCode = async (sessionCode: string, userId: number):Promise <boolean> => {
    let conn;

    if (sessionCode === undefined) {
        return false;
    }

    try {
        conn = await pool.getConnection();
        
        const res = await conn.query('INSERT INTO `Session` (`code`, `host`) VALUES (?, ?) ', [sessionCode, userId]);

        conn.release();

        if (res.affectedRows !== 1) {
            console.error('Failed to save session code.');
            return false;
        }

    } catch (error) {
        conn.release();
        console.error(error);
        return false;
    }

    return true;
}

export const doesSessionExist = async (sessionCode: string, userId: number): Promise<boolean> => {
    let conn;

    try {
        conn = await pool.getConnection();

        const checkIfSessionExists = await conn.query('SELECT id FROM `Session` WHERE `code` = ? AND host = ?', [sessionCode, userId]);
        
        conn.release();
        
        if (checkIfSessionExists.length > 0) {
            return true;
        }

    } catch (error) {
        conn.release();
        console.error(error);
        return true;
    }

    return false;
}