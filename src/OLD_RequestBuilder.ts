import https from 'https';
import querystring from 'querystring';


interface RequestHeaders {
    'Content-Type'?: string;
    Authorization?: string;
    'Content-Length'?: number;
}

interface RequestOptions {
    host: string;
    port: number;
    path: string;
    method: string;
    headers?: RequestHeaders;
    body?: any;
}

// Create a API request builder
const Request = function (options: RequestOptions) {
    if (!options) {
        throw new Error('No options given to request');
    }

    if ('body' in options) {
        options.body = querystring.stringify(options.body);
        // Add content-length header with the body length
        options.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    this._options = options;

    return this._execute();
};

Request.prototype._execute = function () {
    return new Promise((resolve, reject) => {
        const request = https.request(this._options, (res) => {
            // Get a new token
            if (res.statusCode === 401) {
                // Refresh token
                reject(new Error('refresh'));
                return;
            }

            if (res.statusCode > 300) {
                reject(new Error(`GOT ${res.statusCode} HTTP CODE`));
                // return;
            }

            // Data returned from request
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode > 300) {
                    console.log(JSON.parse(data));
                    return;
                }

                if (res.statusCode !== 204) {
                    console.log(res.statusCode);
                    resolve(JSON.parse(data));
                }
                // Send the data back to caller
                resolve(data);
            });
        });

        request.on('error', (err) => {
            reject(err);
        });

        request.on('timeout', () => {
            request.destroy();
            reject(new Error('Request Timeout'));
        });

        // Attach body
        if ('body' in this._options) {
            request.write(this._options.body);
        }
        request.end();
    });
};

export default Request;
