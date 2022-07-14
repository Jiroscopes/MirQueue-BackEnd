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

// Custom way of making requests

export default class MRequest {

    options: RequestOptions | any; // Have to have 'any' because Node's https package yells otherwise

    constructor(options: RequestOptions) {
        if (!options) {
            throw new Error('No options given to request');
        }

        if ('body' in options) {
            options.body = querystring.stringify(options.body);
            options.headers['Content-Length'] = Buffer.byteLength(options.body);
        }

        this.options = options;
    }

    createOptions(host: string, port: number, path: string, method: string, headers?: RequestHeaders, body?: any): RequestOptions {
        return {
            host,
            port,
            path,
            method,
            headers,
            body
        }
    }
    
    async execute(): Promise<string> {
        return new Promise((resolve, reject) => {
            const request = https.request(this.options, (res) => {
                // Get a new token
                if (res.statusCode === 401) {
                    // Refresh token
                    console.log(res.statusMessage);
                    reject(new Error('refresh'));
                    return;
                }
    
                if (res.statusCode > 300) {
                    console.log(res.statusMessage);
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
            if ('body' in this.options) {
                request.write(this.options.body);
            }
            request.end();
        });
    }
}