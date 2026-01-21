import { Response } from 'express';

// Store active clients
let clients: Response[] = [];

/**
 * Handler for SSE endpoint
 */
export function eventsHandler(req: any, res: Response) {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };

    clients.push(res);

    // Remove client on close
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
}

/**
 * Send a progress update to all connected clients
 */
export function sendProgress(message: string, type: 'info' | 'success' | 'error' = 'info') {
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify({ message, type })}\n\n`);
    });
}
