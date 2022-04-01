import express from 'express';
import config from '../../config/';
import { getUserInfo } from '../../db/user';

const router = express.Router();

router.post('/', getUser);

async function getUser(req: any, res: any) {

    if (req.body.accessToken === undefined) {
        res.sendStatus(400);
        return;
    }

    const userInfo = await getUserInfo(req.body.accessToken);

    if (userInfo === null) {
        res.sendStatus(400);
        return;
    } 

    res.json(userInfo);
}

export default router;

