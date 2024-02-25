import http from 'node:http';
const ids = [1, 2, 3, 4];
const chamadasPorID = 20;

function fazerChamadaHTTP(id, baseURL, port) {
    return new Promise((resolve, reject) => {
        const thisURL = `/clientes/${id}/extrato`

        const opcoes = {
            hostname: baseURL,
            port,
            path: thisURL,
            method: 'GET',
        };

        const req = http.request(opcoes, (res) => {
            let dados = '';

            res.on('data', (chunk) => {
                dados += chunk;
            });

            res.on('end', () => {
                console.table({
                    url: thisURL,
                    resp: 'ok'
                })
                resolve(dados);
            });

            res.on('error', () => {
                console.table({
                    url: thisURL,
                    resp: 'error'
                })
                reject()
            })
        });

        req.on('error', (erro) => {
            reject(new Error(`ID ${id}, Erro na chamada HTTP: ${erro.message}`));
        });

        req.end();
    });
}

async function MakeAsyncStressTest(HTTP_URL, HTTP_PORT) {

    // Matriz chamadasPorID X ids.length - convertendo para lista para randomizar melhor
    const matriz_ids = Array.from({ length: chamadasPorID }, () => ids).flat();

    for (let i = matriz_ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matriz_ids[i], matriz_ids[j]] = [matriz_ids[j], matriz_ids[i]];
    }

    const workers = matriz_ids.map(
        el => fazerChamadaHTTP(el, HTTP_URL, HTTP_PORT)
    );

    await Promise.all(workers)

}

export default MakeAsyncStressTest