import httpServer from "./src/http-interface/http-server.js";
import tcpServer from "./src/http-interface/tcp-server.js";
import cluster from 'cluster';
import 'dotenv/config.js'

// Deixar a maior parte para o DB 😍
const numCPUs = 2

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
    console.log(`worker ${process.pid} is running`)
    tcpServer(process.env.TCP_PORT || 3001)
    httpServer(process.env.HTTP_PORT || 3000, process.env.TCP_PORT || 3001)
}