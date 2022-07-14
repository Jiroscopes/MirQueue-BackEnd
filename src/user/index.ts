import Request from '../Request';
import { getRefreshToken, updateAccessToken } from '../db/user';
import config from '../config'

export const getUserEmail = async (accessToken: string) => {
    let infoJSON: any = await getUserInfo(accessToken);
    return infoJSON.email;
};

export const getUsername = async (accessToken: string) => {
    let infoJSON: any = await getUserInfo(accessToken);
    return infoJSON.display_name;
};

export const getUsernameAndEmail = async (accessToken: string): Promise<[string, string]> => {
    let infoJson: any = await getUserInfo(accessToken);
    return [infoJson.display_name, infoJson.email]
}

export const refreshAuthToken = async (username: string) : Promise<any> => {
    if (!username) {
        return null;
    }

    let refreshToken = await getRefreshToken(username);

    if (!refreshToken) {
        return null;
    }

    let req = new Request({
        host: 'accounts.spotify.com',
        port: 443,
        path: '/api/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${config.client_id}:${config.client_secret}`).toString('base64')}`,
        },
        body: {
            grant_type: 'refresh_token',
            refresh_token: `${refreshToken}`,
        },
    });

    // Object with token in it
    let newToken: any;
    try {
        newToken = await req.execute();
    } catch (err) {
        console.error(err);
    }

    if (newToken) {
        if (updateAccessToken(newToken.access_token, username)) {
            return newToken;
        }
    }

    return null;
}

// Only to be called by the other functions for simplicity...
const getUserInfo = async (accessToken: string) => {
    let req = new Request({
        host: 'api.spotify.com',
        port: 443,
        path: '/v1/me',
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${accessToken}`,
        },
    });

    return req.execute();
};
