import express from 'express';
import Request from '../Request'
import config from '../config/';
import { getUsernameAndEmail } from '../user'
import { saveAccessToken, saveRefreshToken, saveUser } from '../db/user';
import '../custom-types';

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
    // save user first
    let verifiedUser = await saveUser(username, email);
    
    if (verifiedUser) {
        // Save Tokens
        if (!saveAccessToken(tokens.access_token, username) || !saveRefreshToken(tokens.refresh_token, username)) {
            res.redirect(`${process.env.APP_URL}/login`);
        }

        req.session.accessToken = tokens.access_token;
        req.session.refreshToken = tokens.refresh_token;
        req.session.saveDate = Math.floor(Date.now() / 1000);
        req.session.expires_in = tokens.expires_in;
        req.session.username = username;
        req.session.email = email;

        req.session.save(() => {    
            // redirect to frontend with access code.
            res.cookie('mirqueue_user', username)
            res.redirect(`${process.env.APP_URL}`);
        });
    }

    if (!verifiedUser) {
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