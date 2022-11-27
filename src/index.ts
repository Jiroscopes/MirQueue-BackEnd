import express from 'express';
import router from './routes';
import config from './config';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import * as path from 'path';
import { getClientCreds } from './ClientCreds';
import { wsServer } from './websocket';
import MySQLSessionStore from 'express-mysql-session';

// @ts-ignore
const MySQLStore = MySQLSessionStore(session);

const app = express();
app.use(cors({credentials: true, origin: `${config.serverUrl}${config.env === 'dev' ? `:3000` : ''}`}));
// app.use(cors({credentials: true}));
app.use(cookieParser('p1$N0H4cKM3'));

const oneDay = 1000 * 60 * 60 * 24;

const sessionConfig = {
    secret: 'p1$N0H4cKM3',
    saveUninitialized: false,
    resave: false,
    store: new MySQLStore(config.db),
    cookie: {
        secure: false,
        maxAge: oneDay,
        resave: false 
    },
}
  
if (config.env === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    // sessionConfig.cookie.secure = true // serve secure cookies
}

const sessionParser = session(sessionConfig);

app.use(session(sessionConfig))

// Allow dotfiles - this is required for verification by Lets Encrypt's certbot
app.use(express.static(path.resolve(__dirname, '../../client/build'), {dotfiles: 'allow'}));


app.use(express.json()) 
app.use(router)

let server: any;

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'), {dotfiles: 'allow'});
});

// Don't start the server until the client codes have been given
getClientCreds().then(val => {    
    // start the Express server
    config.client_creds = val;
    server = app.listen( config.port, () => {
        // tslint:disable-next-line:no-console
    });

    server.on('upgrade', (req: any, socket: any, head: any) => {
        // @ts-ignore
        sessionParser(req, {}, () => {
            wsServer.handleUpgrade(req, socket, head, ws => {
                wsServer.emit('connection', ws, req);
            });
        })
    });
});

// Export for testing
export default app;