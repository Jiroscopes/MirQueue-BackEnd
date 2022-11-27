import express from 'express'
import { getUserInfo } from '../../db/user'
import { refreshAuthToken } from '../../user'
import { doesSessionExist, saveSessionCode, getSessionHost } from '../../db/session'
import config from '../../config'
import Request, {RequestOptions} from '../../Request';
import { getPlayback } from './sessionHost'
const router = express.Router();

router.post('/code', getSessionCode);
router.post('/valid', isValidSessionCode);
router.post('/host/playback', getPlayback);

// /api/session/code

interface WSResponse {
	status: string,
	type: string,
	message?: string,
	payload?: any
}

interface Session {
	type: string,
	user: string, // Current user
	host: string, // Session host
	hostToken?: string
}

interface WSMessage {
	type: string,
	user: string, // Current user
	session: any
}

// Used for refreshing token attempts. 
// TODO: Maybe could be moved to MRequest?
async function retryEndpoint(session: Session, requestOptions: RequestOptions, payload: any = {}): Promise<WSResponse> {
	// Refresh host token in DB
	let newToken = await refreshAuthToken(session.host);
	requestOptions.headers.Authorization = `Bearer ${newToken.access_token}`
	try {
		let addReqRetry = new Request(requestOptions);
		await addReqRetry.execute();
	} catch (error) {
		// We failed again
		return {status: 'failure', type: 'add_song', message: 'Host unavailable'}
	}

	return {status: 'success', type: 'add_song', payload}
}

// TODO: If I ever make guest mode, this will need to change
async function validateRequest(msg: WSMessage, userSession: any): Promise<Session | null> {
	// MirQueue session
	const {session} = msg;

	// Only the host can control playback
	if (msg.type !== 'check_playback' && session.host !== userSession.username) {
		return null;
	}

	let {token: hostToken} = await getSessionHost(session.host);

	if(!hostToken) {
		// Failed
		return null;
	};

	if(!(await doesSessionExist(session.sessionCode, session.host))) {
		// Failed
		return null;
	}

	return {...session, hostToken};
}

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

	// Code will be like "<username>/<code>"
	let splitCode = req.body.code.split('/');
	let host = splitCode[0];
	let code = splitCode[1];

	if (splitCode.length < 2) {
		res.sendStatus(400);
		return;
	}

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

export async function addSong(msg: any): Promise<WSResponse> {

	const {uri, session, trackID, trackName} = msg;
	let {token: hostToken} = await getSessionHost(session.host);

	if(!hostToken) {
		// Failed
		return {status: 'failure', type: 'add_song', message: 'Host not found.'};
	};

	if(!(await doesSessionExist(session.sessionCode, session.host))) {
		// Failed
		return {status: 'failure', type: 'add_song', message: 'Session not found.'};
	}

	const uriPath = `/v1/me/player/queue?uri=${encodeURIComponent(uri)}`;


	let requestOptions: RequestOptions = {
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
			return retryEndpoint(session, requestOptions, {id: trackID, name: trackName});
		}
		return {status: 'failure', type: 'add_song', message: 'Something went wrong'}
	}

	return {status: 'success', type: 'add_song', payload: {id: trackID, name: trackName}}
}

export async function checkPlayback(msg: any, userSession: any): Promise<WSResponse> {
	const session = await validateRequest(msg, userSession);

	if (!session) {
		return { status: 'failure', type: 'check_playback' };
	}
	const uriPath = `/v1/me/player`;

	let requestOptions = {
		host: 'api.spotify.com',
		port: 443,
		path: uriPath,
		method: 'GET',
		headers: {
		  'Content-Type': 'application/json',
		  Authorization: `Bearer ${session.hostToken}`,
		},
	};

	let addReq = new Request(requestOptions);

	let playback: any;

	try {
		// Do the thing
		playback = await addReq.execute();
	} catch (err) {
		if (err.message === 'refresh') {
			return retryEndpoint(session, requestOptions, playback);
		}
		return {status: 'failure', type: 'check_playback'}
	}

	return {status: 'success', type: 'check_playback', payload: playback}
}

export async function playerControl(msg: WSMessage, userSession: any, type: string): Promise<WSResponse> {
	const session = await validateRequest(msg, userSession);

	if (!session) {
		return { status: 'failure', type };
	}

	// Need to see what the current state of playback is
	const { payload: playback } = await checkPlayback({session}, userSession);

	const typeMapping: any = {
		'next_track': 'next',
		'prev_track': 'previous',
		'toggle_playback': (): string => {
			return playback.is_playing ? 'pause' : 'play';
		},
	};

	const typeMethodMapping: any = {
		'next_track': 'POST',
		'prev_track': 'POST',
		'toggle_playback': 'PUT'
	};

	const uriPath = `/v1/me/player/${type === 'toggle_playback' ? typeMapping[type]() : typeMapping[type]}`;

	let requestOptions: RequestOptions = {
		host: 'api.spotify.com',
		port: 443,
		path: uriPath,
		method: typeMethodMapping[type],
		headers: {
		  'Content-Type': 'application/json',
		  Authorization: `Bearer ${session.hostToken}`,
		},
	};

	let addReq = new Request(requestOptions);

	try {
		// Do the thing
		await addReq.execute();
	} catch (err) {
		if (err.message === 'refresh') {
			return retryEndpoint(session, requestOptions);
		}
		return {status: 'failure', type}
	}

	return {status: 'success', type}
}

export default router;