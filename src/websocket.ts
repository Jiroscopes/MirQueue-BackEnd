import ws from 'ws';
import { addSong } from './routes/api/session';

export const wsServer = new ws.Server({ noServer: true });

wsServer.on('connection', socket => {
    socket.on('message', async message => {
		let msg = JSON.parse(message.toString());

		if (msg.type === 'add_song') {
			let addReq = await addSong(msg);
			// Let the client decide what to do
			socket.send(JSON.stringify(addReq));
		}
    });
});