import express from 'express';
import config from '../../config/';
import { getUserInfo, getUserSessions } from '../../db/user';
import '../../custom-types';

const router = express.Router();

router.post('/', getUser);
router.get('/sessions', getSessions);

async function getUser(req: any, res: any) {
    let {accessToken} = req.session;
    const userInfo = await getUserInfo(accessToken);

    if (userInfo === null) {
        res.sendStatus(400);
        return;
    }

    res.cookie()
    res.json(userInfo);
}

async function getSessions(req: any, res: any) {
    let {username} = req.session;

    if (!username) {
        res.sendStatus(401);
        return;
    }

    const codes = await getUserSessions(username);

    // remove the meta
    delete codes.meta;

    // Format sessions
    let usersSessions = [];
    for (const code of codes) {
        usersSessions.push(code.code);
    }

    res.json(usersSessions);
}

export default router;

