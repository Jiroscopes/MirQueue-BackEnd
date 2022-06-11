import express from 'express';
import config from '../../config';
import Request from '../../Request';
import { doesSessionExist } from '../../db/session'

const router = express.Router();

router.post('/', search);

// Take a string and return any data
async function search(req: any, res: any) {
    
    // User can be a guest
    if (!req.body.username || !req.body.searchParam || !req.body.sessionCode || !req.body.host) {
        res.sendStatus(400);
        return;
    }

    let {host, sessionCode, searchParam} = req.body;

    if (!(await doesSessionExist(sessionCode, host.host))) {
		// Conflict
		res.sendStatus(409);
        return;
    }

    const searchLimit = 5;

    let request = new Request({
        host: 'api.spotify.com',
        port: 443,
        path: `/v1/search?q=${encodeURIComponent(searchParam)}&type=track&limit=${searchLimit}&market=us`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // @ts-ignore
            Authorization: `Bearer ${config.client_creds.access_token}`
        },
    });

    let searchRes: any = await request.execute();

    res.json(searchRes['tracks']['items']);
}

export default router;