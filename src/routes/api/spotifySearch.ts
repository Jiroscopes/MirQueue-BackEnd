import express from 'express';
import config from '../../config';
import Request from '../../Request';
import { doesSessionExist } from '../../db/session'
import { getClientCreds } from '../../ClientCreds';

const router = express.Router();

router.post('/', searchHandler);

// Take a string and return any data
async function searchHandler(req: any, res: any) {    
    
    if (!req.body.searchParam || !req.body.sessionCode || !req.body.host) {
        res.sendStatus(400);
        return;
    }

    let {host, sessionCode, searchParam} = req.body;

    if (!(await doesSessionExist(sessionCode, host.host))) {
		// Conflict
		res.sendStatus(409);
        return;
    }

    let searchResults = await search(searchParam);
    return searchResults ? res.json(searchResults) : res.sendStatus(400);
}

async function search(searchParam: string, secondTry: boolean = false) {
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
    
    try {
        let searchRes: any = await request.execute();
        return searchRes['tracks']['items'];
    } catch (error) {
        // If already retried, something else is wrong
        if (secondTry) {
            return false;
        }
        // Get new creds and try again once
        let creds = await getClientCreds();
        config.client_creds = creds;
        search(searchParam, true);
    }
}

export default router;