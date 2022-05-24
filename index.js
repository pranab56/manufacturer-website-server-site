const express = require('express');
const app=express();
const cors=require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port=process.env.PORT || 5000;


app.use(cors())
app.use(express.json())


app.get('/',(req,res)=>{
    res.send('database let,s start')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xrqtw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

 async function run(){
     try{
         await client.connect()
        const productCollection = client.db("electrical").collection("product");
        app.get('/product',async(req,res)=>{
            const query={};
            const result=await productCollection.find(query).toArray();
            res.send(result)
        })
        app.get('/productDetails/:id',async(req,res)=>{
            const id=req.params.id;
            const query={_id:ObjectId(id)};
            const result=await productCollection.findOne(query);
            res.send(result)
            
        })

     }
     finally{
        // await client.close();
     }
 }
 run().catch(console.dir)

  // perform actions on the collection object
  client.close();





app.listen(port,()=>{
    console.log('database is connected',port);
})