import Request from '../Request';

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
