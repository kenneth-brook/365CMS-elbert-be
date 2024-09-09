const express = require('express');
const awsServerlessExpress = require('aws-serverless-express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    //allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/', (req, res) => res.send('Hello World from root!'));
app.get('/test', (req, res) => res.send('Hello World from test!'));

const server = awsServerlessExpress.createServer(app);
exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context);