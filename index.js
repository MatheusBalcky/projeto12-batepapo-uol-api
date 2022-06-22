import express, { response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; dotenv.config();
import chalk from 'chalk';
import dayjs from 'dayjs';
import Joi from 'joi';
import { MongoClient } from 'mongodb';

// & SERVER CONFIG 

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
    const { error } = nameSchema.validate(req.body);
    if(error){
        return res.status(422).send('Preencha o campo nome corretamente!')
    };


    const ifAlreadyExist = db.collection('participants').find(req.body).toArray();
    ifAlreadyExist
    .then( response => {

        if(response.length > 0){
            console.log('aq')
            res.status(409).send('Nome já existente tente outro por favor!')
            return
        } else {
            const lastStatus = '';
            const userDocumment = {
                ...req.body,
                lastStatus: Date.now(),
            }
        
            const promiseInsert = db.collection('participants').insertOne(userDocumment);
            promiseInsert.then( () => {
                res.status(201).send('created'); console.log('User Logged')
            })
        }

    });

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
    promiseInsertMessage.then( () => { 
        res.status(201).send('created');
        console.log('Message sended to API')
    })
});




// & SCHEMA'S VALIDATION

const nameSchema = Joi.object({
    name: Joi.string().min(3).required(),
});




server.listen( process.env.PORT_EXPRESS, console.log(chalk.yellowBright(process.env.URL_EXPRESS)) );