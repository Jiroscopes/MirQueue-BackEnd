import express from 'express';
import Request from '../Request'
import config from '../config/';
import { getUsernameAndEmail } from '../user'
import { saveAccessToken, saveRefreshToken, saveUser } from '../db/user';

const router = express.Router();

router.get('/', async (req, res) => {
    if (req.query['error'] !== undefined) {
        res.status(400).send('Auth Failed');
        return;
    }

    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies['spotify_auth_state'] : null;
    const authCode = req.query['code'] || null;

    // State must exist and match
    if (state === null || storedState === null || state !== storedState) {
        res.redirect(`${process.env.APP_URL}/login`);
        return;
    }

    res.clearCookie('spotify_auth_state');

    if (authCode === null) {
        res.redirect(`${process.env.APP_URL}/login`);
        return;
    }

    let tokens: any = await getAuthTokens(authCode as string);

    const [username, email] = await getUsernameAndEmail(tokens.access_token);
    // save user first, get id of user inserted
    let userId = await saveUser(username, email);
    
    if (userId > 0) {
        // Save Tokens
        if (!saveAccessToken(tokens.access_token, username) || !saveRefreshToken(tokens.refresh_token, username)) {
            res.redirect(`${process.env.APP_URL}/login`);
        }

        // redirect to frontend with access code.
        res.redirect(`${process.env.APP_URL}?access_token=${tokens.access_token}`);
    }

    if (userId === 0) {
        res.redirect(`${process.env.APP_URL}/login`);
    }
});

const getAuthTokens = async (authCode: string) => {
    let request = new Request({
        host: 'accounts.spotify.com',
        port: 443,
        path: '/api/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
                `${config.client_id}:${config.client_secret}`
            ).toString('base64')}`,
        },
        body: {
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: `${process.env.BACKEND_URL}/callback`,
        },
    });

    return request.execute();
}

export default router;