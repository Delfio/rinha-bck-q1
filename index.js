import "dotenv/config.js"

import httpServer from "./src/http-interface/http-server.js";
import tcpServer from "./src/http-interface/tcp-server.js";
import cluster from "node:cluster";
import stressTest from './pre-stress-test.js'
import { setTimeout } from 'node:timers/promises'

const numCPUs = 2

const TCP_HOST = process.env.TCP_HOST || 'localhost'
const TCP_PORT = process.env.TCP_PORT || 3301
const HTTP_PORT = process.env.HTTP_PORT || 3000

const INSTANCE = process.env.INSTANCE
if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    await setTimeout(2000) // por garantia

    if (INSTANCE == "HTTP_SERVER") {
        await stressTest('localhost', HTTP_PORT)
    }

} else {
    console.log(`worker ${process.pid} is running`)

    if (INSTANCE == "TCP_SERVER") {
        tcpServer(TCP_PORT)
    } else if (INSTANCE == "HTTP_SERVER") {
        httpServer(HTTP_PORT, TCP_PORT, TCP_HOST)
    } else {
        tcpServer(TCP_PORT)
        httpServer(HTTP_PORT, TCP_PORT)
    }
}