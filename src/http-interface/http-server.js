import http from 'node:http';
import url from 'node:url';
import tcpClient from './tcp-client.js';

// /clientes/[id]/extrato
export default (HTTP_SERVER_PORT = 3000, TCP_SERVER_PORT = 3001, TCP_HOST = 'localhost') => {
    const client = tcpClient(TCP_HOST, TCP_SERVER_PORT)

    const this_process = process.pid;
    
    const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        if (path.includes('/favicon.ico')) {
            res.end()
            return
        }
        const method = req.method.toLowerCase();

        const firstIndex = path.indexOf('/clientes/') + '/clientes/'.length

        if (method === 'get') {
            const lastIndex = path.indexOf('/extrato')
            const clientId = path.substring(firstIndex, lastIndex);

            const payloadToRequestExtrato = `{"type":"get-client-extrato","data":{"client_id":"${clientId}"}}`
            client.handleSendMessage(payloadToRequestExtrato).then(resp => {
                if (resp.includes('"success":true')) {
                    const bodyResp = resp.substring(23, resp.length - 1)
                    res.writeHead(200, { 'Content-Type': 'application/json', 'ProcessPID': this_process });
                    res.end(bodyResp);
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json', 'ProcessPID': this_process });
                    res.end();
                }

            })
            // Lógica para lidar com requisições GET para /api/endpoint
            return;
        }

        if (method === 'post') {
            const lastIndex = path.indexOf('/transacoes')
            const clientId = path.substring(firstIndex, lastIndex);

            let body = '';
            req.on('data', (chunk) => {
                body += chunk;
            });

            req.on('end', () => {
                const parserData = {
                    ...JSON.parse(body),
                    clientId
                }
                const payloadToIncrementExtrato = `{"type":"increase-client-debt","data":${JSON.stringify(parserData)}}`

                client
                    .handleSendMessage(payloadToIncrementExtrato)
                    .then(resp => {
                        if (resp.includes('"success":true')) {
                            const bodyResp = resp.substring(23, resp.length - 1)
                            res.writeHead(200, { 'Content-Type': 'application/json', 'ProcessPID': this_process });
                            res.end(bodyResp);
                        } else {
                            res.writeHead(422, { 'Content-Type': 'application/json', 'ProcessPID': this_process });
                            res.end();
                        }

                    })

            });
            return
        }
        res.writeHead(404, { 'Content-Type': 'text/plain', 'ProcessPID': this_process });
        res.end('Rota não encontrada');
    });

    const handleStartServer = () => {
        server.listen(HTTP_SERVER_PORT, () => {
            console.log(`HTTP SERVER ENABLE ON ${HTTP_SERVER_PORT}`)
        })

        client.handleConnect()
    }

    // process.once('SIGKILL', () => {
    //     client.end()
    // })

    // process.once('SIGTERM', () => {
    //     client.end()
    // })

    // process.once('SIGABRT', () => {
    //     client.end()
    // })


    return handleStartServer()
}
