import express from 'express';
import callback from './callback';
import login from './login';
import api from './api';
// import login from './login';

const router = express.Router();

router.use('/api', api);
// router.use('/login', login);
router.use('/callback', callback);
router.use('/login', login);
export default router;