import pg from 'pg'

const MY_LOCAL_DB = '192.168.1.4'
// TODO - testar se usando singleton + in memory cache e mais rapido doq transactions com o pg
class PGDB {
    #pgPoll
    constructor() {
        if (PGDB.instance) {
            return PGDB.instance;
        }
        PGDB.instance = this;

        this.#pgPoll = new pg.Pool({
            host: process.env.DB_HOST || MY_LOCAL_DB,
            database: 'rinha',
            user: 'admin',
            password: '123456',
            port: '15432',
            keepAlive: true,
            max: 15,
            idleTimeoutMillis: 0,
            connectionTimeoutMillis: 60_000
        })
        return this;
    }


    async postTransaction({
        valor,
        tipo,
        descricao,
        clientId
    }) {
        const client = await this.#pgPoll.connect()
        try {
            await client.query('BEGIN')

            const querySelectClient = await client
                .query('SELECT limite, saldo, transacoes FROM public.clientes WHERE id = $1',
                    [clientId]
                );

            const thisClientData = querySelectClient.rows[0]

            if (!thisClientData) {
                return {
                    error: true,
                    data: 'client not found'
                }
            }

            const {
                saldo,
                limite,
                transacoes
            } = thisClientData

            const newSaldo = tipo == "d" ?
                saldo - valor :
                saldo + valor;

            const wrongSaldo = newSaldo < 0 &&
                ((newSaldo * -1) > limite)

            if (wrongSaldo) {
                return {
                    error: true,
                    data: 'Client no have limit'
                }
            }

            if (transacoes.length == 10) {
                transacoes.shift()
            }

            const thisTranscation = {
                valor,
                tipo,
                descricao,
                realizada_em: new Date().toISOString()
            }

            transacoes.push(thisTranscation)
            const queryUpdateClientSaldo = 'UPDATE clientes SET saldo = $1, transacoes = $2 WHERE id = $3'
            await client.query(queryUpdateClientSaldo, [newSaldo, JSON.stringify(transacoes), clientId])
            await client.query('COMMIT')

            return {
                error: false,
                data: {
                    limite,
                    saldo: newSaldo
                }
            }
        } catch (err) {

            console.log(err)
            await client.query('ROLLBACK')
            return {
                error: false,
                data: 'Internal server error'
            }
        }
        finally {
            await client.release()
        }
    }

    async getClientTransactions({ clientId }) {
        const client = await this.#pgPoll.connect()

        try {
            const data = await client.query('SELECT id, limite, saldo, transacoes FROM public.clientes WHERE id = $1', [clientId]);
            const {
                limite,
                saldo,
                transacoes
            } = data.rows[0]

            return {
                error: false,
                data: {
                    saldo: {
                        "total": saldo,
                        "data_extrato": new Date().toISOString(),
                        "limite": limite
                    },
                    ultimas_transacoes: transacoes
                }
            }
        } finally {
            client.release()

        }

    }
}

export default PGDB