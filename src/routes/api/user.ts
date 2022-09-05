import express from 'express';
import config from '../../config/';
import { getUserInfo } from '../../db/user';
import '../../custom-types';

const router = express.Router();

router.post('/', getUser);

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

export default router;

