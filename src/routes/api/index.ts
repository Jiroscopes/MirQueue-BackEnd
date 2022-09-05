import express from 'express';
import user from './user';
import session from './session';
import search from './spotifySearch';
import { isAuthenticated } from '../../middlewares'; 
const router = express.Router();

// All routes under /api
router.use('/user', isAuthenticated, user);
router.use('/session', isAuthenticated, session);
router.use('/search', isAuthenticated, search);
export default router;