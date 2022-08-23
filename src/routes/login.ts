import express from 'express';
import config from '../config/';

const router = express.Router();

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
 function generateRandomString(length: number): string {
    var text = '';
    var possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

router.get('/', async (req, res) => {
    const scopes = 'user-read-private user-read-email user-top-read user-modify-playback-state';
    const state = generateRandomString(16);
    const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${config.client_id}&scope=${encodeURIComponent(
        scopes
    )}&redirect_uri=${encodeURIComponent(config.redirect_url())}&show_dialog=true&state=${state}`;
    res.cookie('spotify_auth_state', state);
    res.redirect(url);
});

export default router;