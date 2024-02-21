import server from 'node:net'
import PGDB from '../db-interface/index.js'

// {"success":true,"data":{"client_id":"0"}}
const messagePayload = (data, success) => JSON.stringify(
    {
        success,
        data
    }
)


const pgDb = new PGDB()

export default (TCP_SERVER_PORT) => {

    server.createServer((socket) => {
        socket.write('Let`s start at baby!\r\n');

        socket.on('data', (data) => {
            const isRequestClientExtrato = data.includes('get-client-extrato')

            // Preciso aprender regex
            const firstIndex = data.indexOf('{"client_id":"') + '{"client_id":"'.length
            const lastIndex = data.indexOf('"}}')
            const clientId = data.toString().slice(firstIndex, lastIndex)

            if (isRequestClientExtrato) {
                pgDb.getClientTransactions({ clientId })
                    .then(resp => {
                        socket.write(messagePayload(resp.data, !resp.error))
                    })
                    .catch((err) => {
                        console.log(err)
                        socket.write(messagePayload({}, false))
                    })
            } else {
                const parsedData = JSON.parse(data)

                pgDb.postTransaction({
                    clientId,
                    ...parsedData.data
                }).then(resp => {
                    socket.write(messagePayload(resp.data, !resp.error))
                })
                    .catch((err) => {
                        console.log(err)
                        socket.write(messagePayload({}, false))
                    })
            }
        })

        socket.on('end', () => {
            console.log('Cliente desconectado');
        });
    }).listen(TCP_SERVER_PORT, () => console.log(`TCP SERVER ONLINE AT ${TCP_SERVER_PORT}`))
}
