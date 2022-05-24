const express = require('express');
const app=express();
const cors=require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port=process.env.PORT || 5000;


app.use(cors())
app.use(express.json())



function jwtVerified(req,res,next){
    const authorization=req.headers.authorization;
    if(!authorization){
      return res.status(401).send({message: "UnAuthorization"})
    }
    const token=authorization.split(' ')[1]
    jwt.verify(token, process.env.JWT_TOKEN, function(err, decoded){
     
      if(err){
        return res.status(403).send({message : "forbidden"})}
        req.decoded=decoded;
        next()
    });
   
   
  }


app.get('/',(req,res)=>{
    res.send('database let,s start')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xrqtw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

 async function run(){
     try{
         await client.connect()
        const productCollection = client.db("electrical").collection("product");
        const orderCollection = client.db("electrical").collection("order");
        const userCollection = client.db("electrical").collection("users");
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

        app.get('/users',jwtVerified,async(req,res)=>{
            const result=await userCollection.find().toArray();
            res.send(result)
        })

        app.put('/users/admin/:email',async(req,res)=>{
            const email=req.params.email;
            const filter={email:email};            
            const updateDoc = {
                $set:{role:'admin'},
              };
              const result=await userCollection.updateOne(filter,updateDoc)
              res.send(result)
        })


        app.put('/users/:email',async(req,res)=>{
            const email=req.params.email;
            const user=req.body;
            const filter={email:email};
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
              };
              const result=await userCollection.updateOne(filter,updateDoc,options)
              const token=jwt.sign({email:email},process.env.JWT_TOKEN,{ expiresIn: '1h' })
              res.send({result,token})
        })

        app.get('/order',jwtVerified,async(req,res)=>{
            const email=req.query.email;
            const decodedEmail=req.decoded.email;
            if(email===decodedEmail){
                const query={email : email};
                const order=await orderCollection.find(query).toArray()
               return res.send(order);
            }
            else{
                return res.status(403).send({message:'forbidden'})
            }
         
        })

        app.post('/order',async(req,res)=>{
            const order=req.body;
            const result=await orderCollection.insertOne(order);
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