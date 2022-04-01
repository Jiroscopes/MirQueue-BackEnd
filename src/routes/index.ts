import express from 'express';
import callback from './callback';
import api from './api';
// import login from './login';

const router = express.Router();

router.use('/api', api);
// router.use('/login', login);
router.use('/callback', callback);
export default router;