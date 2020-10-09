require('dotenv').config();
const debug = require("debug")("main");
const mysql = require('promise-mysql');
const http = require('http');

// setup express
const express = require('express');
const app = express();

const restMiddleware = require("./rest-middleware");
const schema = require("./graphql-middleware");
const { ApolloServer } = require("apollo-server-express");

const PORT = 3001;

debug("Tratamos de conectarnos a la BD!");
mysql.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    connectTimeout: 10000, // 10 seconds
    acquireTimeout: 10000, // 10 seconds
    waitForConnections: true,
    queueLimit: 0,
})
.then(async pool => {
    debug("Tenemos conexión a la BD!");

    console.log(await pool.query(`SELECT 1;`));

    app.use(express.json()); // parse application/json

    // inyectamos nuestra conexión a la bd
    app.use((req, _, next) => {
        // debug("middleware | Inyectamos la conexión a la BD en req");
        req.pool = pool;
        next();
    });

    // rest endpoint
    app.use('/rest', restMiddleware);
    
    app.get('/', (req, res) => {
        debug(`Tenemos objeto pool? =>`, !!req.pool);
        res.status(200).end(`Hola mundo!`);
    }); // app.post('/' ...

    // agregamos el middleware de Apollo
    const server = new ApolloServer({
        schema,
        formatError: err => {
            debug(`/graphql => ${err.stack}`);
            return err;
        },

        // context: async ({ req }) => ({ pool: req.pool }),
        context: async ({ req, connection }) => {
            // para suscripciones recibimos connection como definida, pero para
            // queries y mutations usamos req para recuperar el contecto, ya que estamos
            // usanso Express
            return connection ? {...connection.context, pool} : { pool: req.pool }
        },
        tracing: true,
        subscriptions: {
            onConnect: (connectionParams, webSocket, context) => {
                console.log('Subscription client connected');
              // ...
            },
            onDisconnect: (webSocket, context) => {
                console.log('Subscription client disconnected');
              // ...
            },
          },        
    }); // ApolloServer ...

    server.applyMiddleware({ app });

    // recuperamos una instancia de httpServer para habilitar escuchadores websockets para las suscipciones
    const httpServer = app.listen(3001, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
        console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`)
    });
    // 
    server.installSubscriptionHandlers(httpServer);
})
;


/*=============================================================================
    Manejadores para tener una salida limpia
=============================================================================*/
process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {
    if (options.cleanup) {
        console.log("Salida limpia");
    }

    if (exitCode || exitCode === 0) {
        console.log("Exit code:", exitCode);
    }

    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
