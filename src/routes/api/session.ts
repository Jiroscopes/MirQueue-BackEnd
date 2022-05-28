import express from 'express'
import { getUserInfo } from '../../db/user'
import { doesSessionExist, saveSessionCode, getSessionHost } from '../../db/session'
import config from '../../config'
import Request from '../../Request';

const router = express.Router();

router.post('/code', getSessionCode);

// /api/session/code

/*
{
  user: { username: 'byuniique', email: 'steven.popick@gmail.com' },
  token: 'BQCJuMMsP1550P37kkqR0QVku6LqrdRVfX5h31k-q0WDlfNrztcf0-gDs2VCYDEMVx0k-Nqws8vuqNnYIsYA6wFLZbnrC32e_wp82upatMa5ZtAxf861tIQF0jQ0TMZg_4CfH3ymA5cLOhluAWsiGRZ8xUzvgxNZkV3FgSU',
  code: 'test'
}
*/
async function getSessionCode(req: any, res: any) {

	if (!req.body.user || !req.body.token || !req.body.code) {
		res.sendStatus(400);
        return;
    }

	if (req.body.code.length < 4) {
		res.sendStatus(400);
		return;
	}

	let { username, email } = req.body.user;
	let { token, code } = req.body;
	
	if (!username || !email) {
		res.sendStatus(401);
		return;
	}

	// Verify token and user match DB
	let userFromDB = await getUserInfo(token);

	if (userFromDB.username !== username || userFromDB.email !== email) {
		res.sendStatus(401);
		return;
	}

	if(await doesSessionExist(code, userFromDB.id)) {
		// Conflict
		res.sendStatus(409);
		return;
	}

	// save session code
	saveSessionCode(code, userFromDB.id);
    
	res.sendStatus(200);
	return;
}

export async function addSong(msg: any) {

	const {uri, session, user} = msg;
	let {token: hostToken, id: hostId} = await getSessionHost(session.host);

	if(!hostToken || !hostId) {
		// Failed
		return {status: 'failure', message: 'Host not found.'};
	};
	
	if(!doesSessionExist(session.sessionCode, hostId)) {
		// Failed
		return {status: 'failure', message: 'Session not found.'};
	}

	const uriPath = `/v1/me/player/queue?uri=${encodeURIComponent(uri)}`;

	let addReq = new Request({
	  host: 'api.spotify.com',
	  port: 443,
	  path: uriPath,
	  method: 'POST',
	  headers: {
		// @ts-ignore  
		'Content-Type': 'application/x-www-form-urlencoded',
		Authorization: `Bearer ${hostToken}`,
	  },
	});

	// Do the thing
	await addReq.execute();
}

export default router;