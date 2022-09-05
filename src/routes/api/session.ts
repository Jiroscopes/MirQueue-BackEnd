import express from 'express'
import { getUserInfo } from '../../db/user'
import { refreshAuthToken } from '../../user'
import { doesSessionExist, saveSessionCode, getSessionHost } from '../../db/session'
import config from '../../config'
import Request from '../../Request';
import { getPlayback } from './sessionHost'
const router = express.Router();

router.post('/code', getSessionCode);
router.post('/valid', isValidSessionCode);
router.post('/host/playback', getPlayback);

// /api/session/code

/*
{
  user: { username: 'byuniique', email: 'steven.popick@gmail.com' },
  token: 'BQCJuMMsP1550P37kkqR0QVku6LqrdRVfX5h31k-q0WDlfNrztcf0-gDs2VCYDEMVx0k-Nqws8vuqNnYIsYA6wFLZbnrC32e_wp82upatMa5ZtAxf861tIQF0jQ0TMZg_4CfH3ymA5cLOhluAWsiGRZ8xUzvgxNZkV3FgSU',
  code: 'test'
}
*/
async function getSessionCode(req: any, res: any) {
	if (req.body.code.length < 4) {
		res.sendStatus(400);
		return;
	}

	let username = req.session.username;
	let { code } = req.body;
	


	if(await doesSessionExist(code, username)) {
		// Conflict
		res.sendStatus(409);
		return;
	}

	// save session code
	saveSessionCode(code, username);
    
	res.sendStatus(200);
	return;
}

export async function isValidSessionCode(req: any, res: any) {
	if (!req.body.code) {
		res.sendStatus(400);
        return;
    }

	let username = req.session.username;
	let { token } = req.body;

	// Code will be like "<username>/<code>"
	let splitCode = req.body.code.split('/');
	let host = splitCode[0];
	let code = splitCode[1];

	// Verify session
	if(await doesSessionExist(code, host)) {
		// Success
		res.sendStatus(200);
		return;
	}

	// No Session
	res.sendStatus(400);
	return;
}

export async function addSong(msg: any) {

	const {uri, session, trackID, trackName} = msg;
	let {token: hostToken} = await getSessionHost(session.host);

	if(!hostToken) {
		// Failed
		return {status: 'failure', message: 'Host not found.'};
	};

	if(!(await doesSessionExist(session.sessionCode, session.host))) {
		// Failed
		return {status: 'failure', message: 'Session not found.'};
	}

	const uriPath = `/v1/me/player/queue?uri=${encodeURIComponent(uri)}`;


	let requestOptions = {
		host: 'api.spotify.com',
		port: 443,
		path: uriPath,
		method: 'POST',
		headers: {
		  'Content-Type': 'application/x-www-form-urlencoded',
		  Authorization: `Bearer ${hostToken}`,
		},
	};

	let addReq = new Request(requestOptions);

	try {
		// Do the thing
		await addReq.execute();
	} catch (err) {
		if (err.message === 'refresh') {
			// Refresh host token in DB
			let newToken = await refreshAuthToken(session.host);
			requestOptions.headers.Authorization = `Bearer ${newToken.access_token}`
			try {
				let addReqRetry = new Request(requestOptions);
				await addReqRetry.execute();
			} catch (error) {
				// We failed again
				return {status: 'failure', message: 'Host unavailable'}
			}

			return {status: 'success', message: 'Added to queue.', track: {id: trackID, name: trackName}}
		}
		return {status: 'failure', message: 'Something went wrong'}
	}

	return {status: 'success', message: 'Added to queue.', track: {id: trackID, name: trackName}}
}

export default router;