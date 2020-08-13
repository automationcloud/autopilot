import http from 'http';
import { windows } from './windows';
import { AddressInfo } from 'net';

export const server = http.createServer(function (req, res) {
    const url = new URL('http://localhost' + req.url);
    switch (url.pathname) {
        case '/automationcloud/loginResult':
            onLoginResult(url);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(`<html><body onload="setTimeout(1000, self.close());">
                <div>
                    <h2>Automation Cloud Authentication</h2>
                    <p>You may now close the window</p>
                </div>
            </body></html>`);
            res.end();
            break;
        default:
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Resource not found' }));
    }
});

export function startServer(callback: (port: number) => void) {
    server.listen(0, () => {
        const port = getPort();
        console.info(`Server is running on http://localhost:${port}`);
        callback(port);
    });
}

export function getPort(): number {
    return (server.address() as AddressInfo).port;
}

function onLoginResult(url: URL) {
    const profileId = url.searchParams.get('state');
    const code = url.searchParams.get('code');
    const wnd = windows.find(w => (w as any)?.profile.id === profileId);
    if (wnd) {
        // activate the window
        if (wnd.isMinimized()) {
            wnd.restore();
        }
        wnd.focus();
        wnd.webContents.send('loginResult', code);
    }
}
