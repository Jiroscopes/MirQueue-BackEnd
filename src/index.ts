import express from 'express';
import router from './routes';
import config from './config';
import cors from 'cors';
import * as path from 'path';
import { getClientCreds } from './ClientCreds';
import { wsServer } from './websocket';

const app = express();

app.use(express.static(path.resolve(__dirname, '../../client/build')));

app.use(cors());
app.use(express.json()) 
app.use(router)

let server: any;

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'));
});

// Don't start the server until the client codes have been given
getClientCreds().then(val => {    
    // start the Express server
    config.client_creds = val;
    server = app.listen( config.port, () => {
        // tslint:disable-next-line:no-console
    });

    server.on('upgrade', (req: any, socket: any, head: any) => {
        wsServer.handleUpgrade(req, socket, head, socket => {
            wsServer.emit('connection', socket, req);
        });
    });
});

// Export for testing
export default app;