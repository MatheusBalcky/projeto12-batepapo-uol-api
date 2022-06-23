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

let user;

server.get('/participants', (req, res) =>{
    const promiseParticipants = db.collection('participants').find().toArray();

    promiseParticipants
    .then( participants => res.status(200).send(participants) )
    .catch( res.status(500));
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
            user = req.body.name;
            const lastStatus = Date.now();
            const userDocumment = {
                ...req.body,
                lastStatus,
            }
            const promiseInsert = db.collection('participants').insertOne(userDocumment);

            const messageLogin = {
                from: user,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'status',
                time: dayjs().format('HH:mm:ss'),
            };

            const promiseMessageLogin = db.collection('messages').insertOne(messageLogin);

            Promise.all([promiseInsert,promiseMessageLogin])
            .then( (values) => {
                res.status(200).send('Ok')
            })
            .catch( () =>{
                res.status(401).send('Error')
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


server.post('/messages', async (req, res) =>{
    const userHeader = req.headers.user; // ! POSSIVELMENTE USAR PARA VERIFICAÇÃO DPS

    const message = {
        from: user,
        ...req.body,
        time: dayjs().format('HH:mm:ss'),
    };

    const verifyFrom = await db.collection('participants').find({ name: user }).toArray();
    const { error, value } = messageSchema.validate(message)
   
    if(verifyFrom.length > 0 || error || user === undefined){
        res.status(422).send('Unprocessable Entity'); return
    }

    res.status(200).send('ok')

    // ! DESCOMENTAR AQ PARA FUNCIONAR
    // const promiseInsertMessage = db.collection('messages').insertOne(message);
    // promiseInsertMessage.then( () => { 
    //     res.status(201)
    //     console.log('Message sended to API')
    // })
});



// & SCHEMA'S VALIDATION
const nameSchema = Joi.object({
    name: Joi.string().min(3).required(),
});

const messageSchema = Joi.object({
    from: Joi.string(),
    to: Joi.string().min(3),
    text: Joi.string(),
    type: Joi.string().valid('message', 'private_message'),
    time: Joi.any()
})




server.listen( process.env.PORT_EXPRESS, console.log(chalk.yellowBright(process.env.URL_EXPRESS)) );