// Copyright 2020 UBIO Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import http from 'http';
import https from 'https';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export const CA_CERTIFICATES = [
    '../../certs/roxi-ca.crt',
    '../../certs/vgs-live.crt',
    '../../certs/vgs-sandbox.crt',
].map(file => fs.readFileSync(path.resolve(__dirname, file)));

// To obtain SHA256 SPKI signature fingerprint of certificate:
// openssl x509 -noout -in ./mycert.crt -pubkey | openssl asn1parse -noout -inform pem -out ./mycert.key
// openssl dgst -sha256 -binary ./mycert.key  | openssl enc -base64
export const SPKI_SIGNATURES = [
    'hMHyzUhJwWbOEUX/mbxS1p15qpou3qTrCgzasXyrELE=',
    '+BV7LvDL+CT6iq4RpgEpBQWLbjms3UyFfIdN0WUOfk8=',
    'duNwCVgxuLb+901jd6ui3qfljU55KiwgMJB1EuueDB0=',
];

export class RoutingProxy extends EventEmitter {
    protected routes: ProxyRoute[] = [];
    protected server: http.Server | null = null;
    protected clientSockets: Set<net.Socket> = new Set();

    /**
     * Clears routing table. All requests will be routed directly.
     */
    clearRoutes() {
        this.routes = [];
        // this.closeAllSockets();
    }

    /**
     * Inserts new route. Requests matching specified `hostRegexp` will be routed
     * to specified `upstream` (if upstream is `null`, requests are routed directly).
     * New route is inserted at the beginning of the list, and routes are matched in order
     * they added (first match wins).
     */
    addRoute(hostRegexp: RegExp, upstream: ProxyRouteUpstream | null, label: string = 'default') {
        this.routes.unshift({ label, hostRegexp, upstream });
        // this.closeAllSockets();
    }

    /**
     * Removes routes matching specified label.
     */
    removeRoutes(label: string) {
        this.routes = this.routes.filter(r => r.label !== label);
        // this.closeAllSockets();
    }

    async start(port: number) {
        await new Promise((resolve, reject) => {
            this.server = http
                .createServer()
                .on('connection', socket => this.onConnection(socket))
                .on('request', (req, res) => this.onRequest(req, res))
                .on('connect', (req, socket) => this.onConnect(req, socket))
                .on('close', () => (this.server = null))
                .listen(port, '127.0.0.1');
            this.server.on('listening', () => {
                return resolve();
            });
            this.server.on('error', error => {
                return reject(error);
            });
        });
    }

    async shutdown(force: boolean = false) {
        return new Promise(resolve => {
            if (force) {
                this.closeAllSockets();
            }
            if (this.server) {
                this.server.once('close', resolve);
                this.server.close();
            } else {
                resolve();
            }
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
    }

    isRunning() {
        return this.server != null;
    }

    protected makeAuthHeader(upstream: ProxyRouteUpstream) {
        const { username = '', password = '' } = upstream;
        return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    }

    closeAllSockets() {
        for (const socket of this.clientSockets) {
            socket.destroy();
        }
    }

    protected onConnection(socket: net.Socket) {
        this.clientSockets.add(socket);
        socket.once('close', () => this.clientSockets.delete(socket));
    }

    // HTTP

    protected onRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        const upstream = this.matchRoute(req.url!);
        const fwdReq = upstream ? this.createTunnelingHttpRequest(req, upstream) : this.createDirectHttpRequest(req);
        fwdReq.on('error', (err: CustomError) => {
            err.details = { initiator: 'httpForwardedRequest', ...err.details };
            this.emit('error', err);
            res.writeHead(599);
            res.end();
        });
        fwdReq.on('response', fwdRes => {
            if (fwdRes.statusCode != null) {
                res.writeHead(fwdRes.statusCode, fwdRes.headers);
                fwdRes.pipe(res);
            }
        });
        req.pipe(fwdReq);
    }

    protected createTunnelingHttpRequest(req: http.IncomingMessage, upstream: ProxyRouteUpstream): http.ClientRequest {
        const [hostname, port] = upstream.host.split(':');
        const options = {
            hostname,
            port,
            path: req.url,
            method: req.method,
            headers: req.headers,
        };
        const fwdReq = upstream.useHttps ?
            https.request({ ...options, ca: CA_CERTIFICATES}) :
            http.request(options);
        if (upstream.username || upstream.password) {
            fwdReq.setHeader('Proxy-Authorization', this.makeAuthHeader(upstream));
        }
        return fwdReq;
    }

    protected createDirectHttpRequest(req: http.IncomingMessage): http.ClientRequest {
        const { hostname, port = 80, pathname, search } = new URL(req.url!);
        return http.request({
            hostname,
            port,
            path: pathname + search,
            method: req.method,
            headers: req.headers,
        });
    }

    // HTTPS

    protected onConnect(req: http.IncomingMessage, clientSocket: net.Socket) {
        // Note: req.url contains Host
        const upstream = this.matchRoute(req.url!);
        if (upstream) {
            this.handleSslTunnel(req, clientSocket, upstream);
        } else {
            this.handleSslDirect(req, clientSocket);
        }
    }

    protected handleSslTunnel(req: http.IncomingMessage, clientSocket: net.Socket, upstream: ProxyRouteUpstream) {
        const connectReq = this.createTunnelingConnectReq(req, upstream);
        connectReq.on('error', (err: CustomError) => {
            err.details = { initiator: 'httpsConnectRequest', ...err.details };
            this.emit('error', err);
            clientSocket.end();
        });
        connectReq.on('connect', (res: http.IncomingMessage, upstreamSocket: net.Socket) => {
            // TODO add logging when response is not 200
            upstreamSocket.on('error', (err: CustomError) => {
                err.details = { initiator: 'httpsTunnelUpstreamSocket', ...err.details };
                this.emit('error', err);
            });
            clientSocket.on('error', (err: CustomError) => {
                err.details = { initiator: 'httpsTunnelClientSocket', ...err.details };
                this.emit('error', err);
            });
            clientSocket.write(`HTTP/${req.httpVersion} ${res.statusCode} ${res.statusMessage}\r\n\r\n`);
            upstreamSocket.pipe(clientSocket);
            clientSocket.pipe(upstreamSocket);
        });
        connectReq.end();
    }

    protected createTunnelingConnectReq(req: http.IncomingMessage, upstream: ProxyRouteUpstream): http.ClientRequest {
        const { useHttps = true } = upstream;
        const [hostname, port] = upstream.host.split(':');
        const request = useHttps ? https.request : http.request;
        const connectReq = request({
            hostname,
            port,
            path: req.url,
            method: 'CONNECT',
            headers: req.headers,
            timeout: 10000,
            ca: CA_CERTIFICATES,
            ALPNProtocols: ['http/1.1'],
        } as any);
        if (upstream.username || upstream.password) {
            connectReq.setHeader('Proxy-Authorization', this.makeAuthHeader(upstream));
        }
        return connectReq;
    }

    protected handleSslDirect(req: http.IncomingMessage, clientSocket: net.Socket) {
        const url = new URL('https://' + req.url!);
        const remoteSocket = net.connect(Number(url.port) || 443, url.hostname);
        clientSocket.write(`HTTP/${req.httpVersion} 200 OK\r\n\r\n`);
        remoteSocket.on('error', (err: CustomError) => {
            err.details = { initiator: 'httpsDirectRemoteSocket', ...err.details };
            this.emit('error', err);
        });
        clientSocket.on('error', (err: CustomError) => {
            err.details = { initiator: 'httpsDirectClientSocket', ...err.details };
            this.emit('error', err);
        });
        remoteSocket.pipe(clientSocket);
        clientSocket.pipe(remoteSocket);
    }

    // Routing

    matchRoute(host: string): ProxyRouteUpstream | null {
        for (const route of this.routes) {
            if (route.hostRegexp.test(host)) {
                return route.upstream;
            }
        }
        return null;
    }

    // Serialization (because RegExps are not otherwise serializable)

    getSerializedRoutes(): SerializedProxyRoute[] {
        return this.routes.map(_ => {
            return {
                label: _.label,
                hostRegexp: {
                    source: _.hostRegexp.source,
                    flags: _.hostRegexp.flags,
                },
                upstream: _.upstream,
            };
        });
    }

    setSerializedRoutes(serializedRoutes: SerializedProxyRoute[]) {
        this.routes = serializedRoutes.map(sr => {
            return {
                label: sr.label,
                hostRegexp: new RegExp(sr.hostRegexp.source, sr.hostRegexp.flags),
                upstream: sr.upstream,
            };
        });
    }
}

export interface ProxyRoute {
    label: string;
    hostRegexp: RegExp;
    upstream: ProxyRouteUpstream | null;
}

export interface ProxyRouteUpstream {
    host: string;
    username?: string;
    password?: string;
    useHttps?: boolean;
}

export interface SerializedProxyRoute {
    label: string;
    hostRegexp: {
        source: string;
        flags: string;
    };
    upstream: ProxyRouteUpstream | null;
}

interface CustomError {
    details: any;
}
