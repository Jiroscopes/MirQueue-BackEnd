import express from 'express';
import user from './user';
import session from './session';
import search from './spotifySearch';

const router = express.Router();

// All routes under /api
router.use('/user', user);
router.use('/session', session);
router.use('/search', search)
export default router;