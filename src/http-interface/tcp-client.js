import net from 'node:net';
// import readline from 'node:readline';

export default (HOST = 'localhost', PORT = 3000) => {
    const client = new net.Socket();

    console.log(`TCP CLIENT ONLINE`)
    const handleConnect = () => {
        client.connect(PORT, HOST, () => {
            console.log(`Conectado ao servidor em ${HOST}:${PORT}`);
            // rl.on('line', (input) => {
            //     if (input.includes('exit')) {
            //         client.write('Bye');
            //         client.destroy()
            //     }
            //     client.write(input)
            // });

            // Se o servidor enviar msg e não tiver um client escutando as msgs acumulam gerando uma fila de msgs
            client.on('data', (data) => {
                // console.log(`server connected: ${data}`);
            });

            client.on('close', () => {
                console.log('Conexão com o servidor encerrada');
                process.exit(0);
            });
        });
    }

    const handleSendMessage = async (data) => {
        let recivedFn = null
        return new Promise((resolv) => {
            client.write(data);
            // importante limpar a ref para não causar leakers
            recivedFn = (_data) => resolv(_data.toString())
            client.on('data', recivedFn);
        }).then(resp => {
            client.removeListener('data', recivedFn)
            return resp
        })
    }

    client.on('error', (err) => {
        console.error(`Erro na conexão: ${err.message}`);
    });

    return {
        handleSendMessage,
        handleConnect
    }
}