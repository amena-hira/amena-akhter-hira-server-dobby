const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.port || 5000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());

const JWT_SECRET = process.env.ACCESS_TOKEN;

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.cwbwt8c.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);

async function run() {
    try {
        const authCollection = client.db('dobby').collection('auth');
        const imageCollection = client.db('dobby').collection('image');

        app.post('/signup', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await authCollection.insertOne(user);
            res.send(result);
        })
        app.post('/login', async (req, res) => {
            const user = req.body;
            const email = req.body.email;
            const password = req.body.password;
            const query = { email };
            const result = await authCollection.findOne(query);
            const checkPassword = result.password;
            if (checkPassword === password) {
                const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' })
                console.log(token);
                res.send({ status: true, token: token });
            }
            else {
                res.send({ status: false });
            }
        })
        app.post('/authUser', async (req, res) => {
            const { token } = req.body;
            try {
                const user = jwt.verify(token, JWT_SECRET);
                const email = user.email;
                const query = { email };
                const result = await authCollection.findOne(query);
                res.send(result);

            } catch (error) {
                res.send(error);
            }
        })

        /*-------------------Upload Images-------------------*/
        app.post('/image', async (req, res) => {
            const imageData = req.files.image.data;
            const imageToString = imageData.toString('base64');
            const imageBuffer = Buffer.from(imageToString, 'base64');
            const imageUpload = {
                name: req.body.name,
                imageFile: imageBuffer
            }
            const result = await imageCollection.insertOne(imageUpload);
            res.send(result);

        })
        app.get('/image', async (req, res) => {
            const query = {};
            const result = await imageCollection.find(query).sort({_id:-1}).toArray();
            res.send(result);
        })
        app.get('/image/:search', async (req, res) => {
            const search = req.params.search;
            const regex = new RegExp(search, 'i')
            const query = {name: {$regex: regex} };
            const result = await imageCollection.find(query).sort({_id:-1}).toArray();
            // console.log(result);
            res.send(result);
        })

    }
    finally {

    }

}
run().catch(error => console.log(error));

app.get('/', async (req, res) => {
    res.send('server is running');
})

app.listen(port, () => console.log(`Server running on ${port}`))