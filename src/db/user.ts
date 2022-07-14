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
        
        const res = await conn.query('UPDATE `Spotify_Refresh_Token` SET token = ?, date_added = CURRENT_TIMESTAMP() WHERE username = ?', [token, username]);
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

        const res = await conn.query('SELECT token FROM `Spotify_Refresh_Token` srt INNER JOIN User u ON u.id = srt.user_id WHERE u.username = ?', [username]);
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

        const checkToken = await conn.query('SELECT user_id, token FROM `Spotify_Access_Token` sat INNER JOIN User u ON u.id = sat.user_id WHERE username = ?', username);

        if (checkToken.length > 0) {
            conn.release();
            // update token instead.
            return await updateAccessToken(token, username);
        }

        const res = await conn.query('INSERT INTO `Spotify_Access_Token` (`token`, `user_id`) VALUES (?, ?)', [token, checkToken[0].user_id]);

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

        const checkToken = await conn.query('SELECT user_id, token FROM `Spotify_Refresh_Token` srt INNER JOIN User u ON u.id = srt.user_id WHERE username = ?', username);

        if (checkToken.length > 0) {
            conn.release();
            // update token instead.
            return await updateRefreshToken(token, username);
        }

        const res = await conn.query('INSERT INTO `Spotify_Refresh_Token` (`token`, `user_id`) VALUES (?, ?)', [token, checkToken[0].user_id]);

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

export const saveUser = async (username: string, email: string): Promise<number> => {
    let conn;

    if (username === undefined || email === undefined) {
        return 0;
    }

    try {
        conn = await pool.getConnection();
        // Check if user exists
        const checkUser = await conn.query('SELECT `id` FROM `User` WHERE `username` = ? AND `email` = ?', [username, email]);

        if (checkUser.length > 0) {
            conn.release();
            return checkUser[0].id;
        }

        const res = await conn.query('INSERT INTO `User` (`username`, `email`) VALUES (?, ?)', [username, email]);

        conn.release();

        if (res.affectedRows !== 1) {
            console.error('Failed to save the user');
            return 0;
        }
        return res.insertId
    } catch (err) {
        conn.release();
        console.error(err);
        return 0;
    }
}

export const updateAccessToken = async (token: string, username: string): Promise<boolean> => {
    let conn;

    if (token === undefined) {
        return false;
    }

    try {
        conn = await pool.getConnection();
        
        const res = await conn.query('UPDATE `Spotify_Access_Token` sat INNER JOIN User u ON u.id = sat.user_id SET token = ?, sat.date_added = CURRENT_TIMESTAMP() WHERE username = ?', [token, username]);
        
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
        const userInfo = await conn.query('SELECT u.id, username, email FROM User u INNER JOIN Spotify_Access_Token sat ON u.id = sat.user_id WHERE sat.token = ?', token);
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