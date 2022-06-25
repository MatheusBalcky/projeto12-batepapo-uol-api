import express, { response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; dotenv.config();
import chalk from 'chalk';
import dayjs from 'dayjs';
import Joi from 'joi';
import { MongoClient, ObjectId } from 'mongodb';

// & SERVER CONFIG 
const server = express();
server.use(express.json(), cors());

const client = new MongoClient(process.env.MONGO_URI);
let db;
client.connect().then( () => db = client.db("test") )

let user = 'test';






server.get('/participants', (req, res) =>{
    const promiseParticipants = db.collection('participants').find().toArray();

    promiseParticipants
    .then( participants => res.status(200).send(participants) )
    .catch( res.status(500));
})


server.post('/participants', (req, res) =>{
    const { name } = req.body
    const { error } = nameSchema.validate(req.body);
    
    if(error){
        return res.status(422).send('Preencha o campo nome corretamente!')
    };


    const ifAlreadyExist = db.collection('participants').find({ name }).toArray();
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


server.get('/messages', async (req, res) =>{
    const { user } = req.headers;
    const { limit } = req.query;

    try {
        const promiseMessages =  await db.collection('messages').find({
            $or:[ 
                { type: 'status'  }, { type: 'message'  }, // * RETORNA O DOCUMENTO EM QUE A MENSAGEM É PARA TODOS
                { to: user}, // * RETORNA O DOCUMENTO COM A MENSAGEM PRIVADA QUE MANDARAM PARA O USER
                { from: user } // * RETORNA O DOCUMENTO COM A MENSAGEM PRIVADA QUE O USER MANDOU
            ]
        }).toArray();

        console.log(promiseMessages.length, ' tamanho mensagem sem limit');

        // & FILTRAR COM O LIMIT SE HOUVER AGORA

        if(limit){
            console.log('Entrou na condição com: ', promiseMessages.length, 'E limit: ', limit)
            const messagesWithLimit = [];

            for (let i = promiseMessages.length - 1; ; i--){

                messagesWithLimit.push(promiseMessages[i]);
                
                if (messagesWithLimit.length === parseInt(limit) || i ===  0){
                    break
                };
                
            }

            messagesWithLimit.reverse()
            res.status(200).send(messagesWithLimit);
            return
        }
        console.log('test dps do if')
        res.status(200).send(promiseMessages);

    } catch (error) {
        res.sendStatus(400)

        console.log(chalk.red(error))
    }

})


server.post('/messages', async (req, res) =>{
    const userHeader = req.headers.user; // ! POSSIVELMENTE USAR PARA VERIFICAÇÃO DPS
    user = userHeader;
    const message = {
        from: user,
        ...req.body,
        time: dayjs().format('HH:mm:ss'),
    };

    try {
        const verifyFrom = await db.collection('participants').find({ name: user }).toArray();
        if (verifyFrom.length === 0) throw new Error('Usuário não se encontra como participante do chat');

        const { error, value } =  await messageSchema.validateAsync(message);
        
        const promiseInsertMessage = await db.collection('messages').insertOne(message);
        res.sendStatus(201);

        console.log(chalk.green('Message sended to API'));
    } catch (error) {
        res.status(422).send(`${error}`);
    }
});

server.post('/status', async (req, res) =>{
    const { user } = req.headers;
  
    try {
        const userOnline = await db.collection('participants').find({ name: user }).toArray();
    
        if(userOnline.length > 0){
            
            await db.collection('participants').updateOne({
                name: user
            },{
                $set: { lastStatus: Date.now() }
            });

            res.sendStatus(200);
            return;
        }

        throw new Error('Usuário não se encontra como participante do chat');
    } catch (error) {
        res.status(404).send(`${error}`)
    }

})






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