import e, { Request, Response, NextFunction } from 'express';

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    // No dice
    if (!req.session || !req.session.accessToken && req.baseUrl !== '/api/search') {
        console.error('No Session');
        req.session.destroy(() => {
            res.clearCookie('mirqueue_user');
            res.redirect(`${process.env.APP_URL}/login`);
        });
        return;
    }

    if (!req.session.username) {
        console.error('No Username');
        req.session.destroy(() => {
            res.clearCookie('mirqueue_user');
            res.redirect(`${process.env.APP_URL}/login`);
        });
        return;
    }

    const expiresIn = req.session.expires_in ?? 0;
    const expireDate = (req.session.saveDate ?? 0) + expiresIn;
    const now = Math.floor(Date.now() / 1000);
    
    // Auth token is old, make them re-login just to be sure
    if (now >= expireDate) {
        console.error('Expired');
        req.session.destroy(() => {
            res.clearCookie('mirqueue_user');
            res.redirect(`${process.env.APP_URL}/login`);
        });
        return;
    }

    next();
}
