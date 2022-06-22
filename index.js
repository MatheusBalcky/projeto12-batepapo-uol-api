import express, { response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; dotenv.config();
import chalk from 'chalk';
import dayjs from 'dayjs';
import { MongoClient } from 'mongodb';

const server = express();
server.use(express.json(), cors());

const client = new MongoClient(process.env.MONGO_URI);
let db;
client.connect().then( () => db = client.db("test") )


server.get('/participants', (req, res) =>{
    const promiseParticipants = db.collection(participants).find();

    promiseParticipants
    .then( participants => res.send(participants))
    .catch( res.send('Connection Error'));
})


server.post('/participants', (req, res) =>{
    const lastStatus = '';
    const user = {
        ...req.body,
        lastStatus,
    }
    
    const promiseInsert = db.collection('participants').insertOne(user);
    promiseInsert.then( () => {res.status(201).send('created'); console.log('User Logged')} )
});


server.get('/messages', (req, res) =>{
    const promiseMessages = db.collection(messages).find();

    promiseMessages
    .then( messages => res.send(messages))
    .catch( res.send('Connection Error'));
})


server.post('/messages', (req, res) =>{
    const userHeader = req.headers.user; // ! POSSIVELMENTE USAR PARA VERIFICAÇÃO DPS

    const message = {
        ...req.body,
    };
    
    const promiseInsertMessage = db.collection('messages').insertOne(message);
    promiseInsertMessage.then( () => {res.status(201).send('created'); console.log('Message sended to API')} )
})





server.listen( process.env.PORT_EXPRESS, console.log(chalk.yellowBright(process.env.URL_EXPRESS)) );