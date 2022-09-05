import pool from './index';

type User = {
    id: number
    username: string,
    email: string,
}

const updateRefreshToken = async (token: string, username: string): Promise<boolean> => {
    let conn;

    if (token === undefined) {
        return false;
    }

    try {
        conn = await pool.getConnection();
        
        const res = await conn.query('UPDATE `Spotify_Refresh_Token` SET token = ?, date_added = CURRENT_TIMESTAMP() WHERE user = ?', [token, username]);
        conn.release();

        if (res.affectedRows !== 1) {
            console.error('Failed to update refresh token');
            return false;
        }
    } catch (err) {
        conn.release();
        console.error(err);
        return false;
    }

    return true;
}

export const getRefreshToken = async (username: string): Promise<string> => {
    let conn;
    let token: string;

    try {
        conn = await pool.getConnection();

        const res = await conn.query('SELECT token FROM `Spotify_Refresh_Token` WHERE user = ?', [username]);
        conn.release();

        if (res.length < 1) {
            console.error('Could not find refresh token');
            return null;
        }

        token = res[0].token;

    } catch (error) {
        conn.release();
        console.error(error);
        return null
    }

    return token;
}

export const saveAccessToken = async (token: string, username: string): Promise<boolean> => {
    let conn;

    if (token === undefined) {
        return false;
    }

    try {
        conn = await pool.getConnection();

        const checkToken = await conn.query('SELECT token FROM `Spotify_Access_Token` WHERE user = ?', username);

        if (checkToken.length > 0) {
            conn.release();
            // update token instead.
            return await updateAccessToken(token, username);
        }

        const res = await conn.query('INSERT INTO `Spotify_Access_Token` (`token`, `user`) VALUES (?, ?)', [token, username]);

        conn.release();
        
        if (res.affectedRows !== 1) {
            console.error('Failed to save the access token');
            return false;
        }
    } catch (err) {
        conn.release();
        console.error(err);
        return false;
    } 

    return true;
}

export const saveRefreshToken = async (token: string, username: string): Promise<boolean> => {
    let conn;

    if (token === undefined) {
        return false;
    }

    try {
        conn = await pool.getConnection();

        const checkToken = await conn.query('SELECT token FROM `Spotify_Refresh_Token` WHERE user = ?', username);

        if (checkToken.length > 0) {
            conn.release();
            // update token instead.
            return await updateRefreshToken(token, username);
        }

        const res = await conn.query('INSERT INTO `Spotify_Refresh_Token` (`token`, `user`) VALUES (?, ?)', [token, username]);

        conn.release();

        if (res.affectedRows !== 1) {
            console.error('Failed to save the refresh token');
            return false;
        }

    } catch (err) {
        conn.release();
        console.error(err);
        return false;
    }

    return true;
}

export const saveUser = async (username: string, email: string): Promise<boolean> => {
    let conn;

    if (username === undefined || email === undefined) {
        return false;
    }

    try {
        conn = await pool.getConnection();
        // Check if user exists
        const checkUser = await conn.query('SELECT username FROM `User` WHERE `username` = ? AND `email` = ?', [username, email]);

        if (checkUser.length > 0) {
            conn.release();
            return true;
        }

        const res = await conn.query('INSERT INTO `User` (`username`, `email`) VALUES (?, ?)', [username, email]);

        conn.release();

        if (res.affectedRows !== 1) {
            console.error('Failed to save the user');
            return false;
        }
        return true;
    } catch (err) {
        conn.release();
        console.error(err);
        return false;
    }
}

export const updateAccessToken = async (token: string, username: string): Promise<boolean> => {
    let conn;

    if (token === undefined) {
        return false;
    }

    try {
        conn = await pool.getConnection();
        
        const res = await conn.query('UPDATE `Spotify_Access_Token` SET token = ?, date_added = CURRENT_TIMESTAMP() WHERE user = ?', [token, username]);
        
        conn.release();

        if (res.affectedRows !== 1) {
            console.error('Failed to update access token');
            return false;
        }
    } catch (err) {
        conn.release();
        console.error(err);
        return false;
    }

    return true;
}

export const getUserInfo = async (token: string): Promise<User> => {
    let conn;

    if (token === undefined) {
        console.error('No token provided')
        return null;
    }

    try {
        conn = await pool.getConnection();
        
        // Get email and username
        const userInfo = await conn.query('SELECT username, email FROM User u INNER JOIN Spotify_Access_Token sat ON u.username = sat.user WHERE sat.token = ?', token);
        conn.release();

        if (userInfo.length === 0) {
            return null;
        }

        return userInfo[0];

    } catch (error) {
        conn.release();
        console.error(error);
        return null;
    }
}