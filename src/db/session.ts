import pool from './index';

export const saveSessionCode = async (sessionCode: string, username: string):Promise <boolean> => {
    let conn;

    if (sessionCode === undefined) {
        return false;
    }

    try {
        conn = await pool.getConnection();
        
        const res = await conn.query('INSERT INTO `Session` (`code`, `host`) VALUES (?, ?) ', [sessionCode, username]);

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

export const doesSessionExist = async (sessionCode: string, hostName: string): Promise<boolean> => {
    let conn;

    try {
        conn = await pool.getConnection();
        const checkIfSessionExists = await conn.query('SELECT host FROM Session WHERE code = ? AND host = ?', [sessionCode, hostName]);
        
        conn.release();

        if (checkIfSessionExists.length > 0) {
            return true;
        }
    } catch (error) {
        conn.release();
        console.error(error);
        return false;
    }

    return false;
}

export const getSessionHost = async (hostName: string) => {
    let conn;

    try {
        conn = await pool.getConnection();

        const sessionHostToken = await conn.query('SELECT token FROM Spotify_Access_Token WHERE user = ?', [hostName]);
        conn.release();
        
        if (sessionHostToken.length > 0) {
            // Will contain token
            return sessionHostToken[0];
        }

    } catch (error) {
        conn.release();
        console.error(error);
        return false;
    }

    return false;
}