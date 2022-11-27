import ws from 'ws';
import { addSong, checkPlayback, playerControl } from './routes/api/session';
import { addUserToSession } from './db/session';
export const wsServer = new ws.Server({ noServer: true });

// WS contains the session from the upgrade event
wsServer.on('connection', (ws, req: any) => {
    ws.on('message', async message => {
		let msg = JSON.parse(message.toString());
		if (msg.type === 'joined_session') {
			addUserToSession(msg.user, msg.session)
		}
		if (msg.type === 'add_song') {
			let addReq = await addSong(msg);
			// Let the client decide what to do
			ws.send(JSON.stringify(addReq));
		}
		if (msg.type === 'check_playback') {

			let playback = await checkPlayback(msg, req.session);
			ws.send(JSON.stringify(playback));
		}
		if (msg.type === 'toggle_playback') {
			let res = await playerControl(msg, req.session, 'toggle_playback');
			if (res.status === 'unauthorized') {
				// Reject
				ws.terminate()
			}
			ws.send(JSON.stringify(res));
		}
		if (msg.type === 'next_track') {
			let res = await playerControl(msg, req.session, 'next_track');
			if (res.status === 'unauthorized') {
				// Reject
				ws.terminate()
			}
			ws.send(JSON.stringify(res));
		}
		if (msg.type === 'prev_track') {
			let res = await playerControl(msg, req.session, 'prev_track');
			if (res.status === 'unauthorized') {
				// Reject
				ws.terminate()
			}
			ws.send(JSON.stringify(res));
		}
    });
});