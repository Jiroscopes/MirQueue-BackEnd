import config from './config';
import Request from './Request';

/** 
{
  access_token: 'BQD6lp4f3hqe8gBvD2yWtnlXteVFh4qwNwqlt2513N-jeUh8cSo0ut_YQMbKdHpJHLAFsvgr7fEfjT5V0iE',
  token_type: 'Bearer',
  expires_in: 3600
}  
 **/
export const getClientCreds = () => {
    const request = new Request({
        host: 'accounts.spotify.com',
        port: 443,
        path: '/api/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
                `${config.client_id}:${config.client_secret}`
            ).toString('base64')}`,
        },
        body: {
            grant_type: 'client_credentials'
        }
    }) 

    return request.execute();
}
