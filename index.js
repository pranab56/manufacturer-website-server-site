const express = require('express');
const app=express();
const cors=require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe=require('stripe')(process.env.STRIPE_TOKEN_KEY);
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
        const paymentCollection = client.db("electrical").collection("payments");
        const userCollection = client.db("electrical").collection("users");
        const profileCollection = client.db("electrical").collection("profile");
        const reviewCollection = client.db("electrical").collection("review");
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
        app.post('/product',async(req,res)=>{
            const product=req.body;
            const result=await productCollection.insertOne(product);
            res.send(result)
        })

        app.get('/review',async(req,res)=>{
            const query={};
            const review=await reviewCollection.find(query).toArray();
            res.send(review);
        })

        app.post('/review',async(req,res)=>{
            const review=req.body;
            const userReview=await reviewCollection.insertOne(review);
            res.send(userReview);
        })


       

        
        app.post('/profile',async(req,res)=>{
            const profile=req.body;
            const result=await profileCollection.insertOne(profile);
            res.send(result)
        })

        app.get('/users',jwtVerified,async(req,res)=>{
            const result=await userCollection.find().toArray();
            res.send(result)
        })

        app.get('/admin/:email',async(req,res)=>{
            const email=req.params.email;
            const user=await userCollection.findOne({email:email});
            const isAdmin=user.role === 'admin';
            res.send({admin : isAdmin})
        })

        app.put('/users/admin/:email',jwtVerified,async(req,res)=>{
            const email=req.params.email;
            const check=req.decoded.email;
            const checkAccount=await userCollection.findOne({email : check});
            if(checkAccount.role ==='admin'){
                const filter={email:email};            
                const updateDoc = {
                    $set:{role:'admin'},
                  };
                  const result=await userCollection.updateOne(filter,updateDoc)
                  res.send(result)
            }
            else{
                res.status(403).send({message:'forbidden'})
            }
            
        });


        app.post('/create-Payment-Intent', jwtVerified, async(req, res) =>{
            const order = req.body;
            const price = order.price;
            const amount = price*100;
            const paymentIntent = await stripe.paymentIntents.create({
              amount : amount,
              currency: 'usd',
              payment_method_types:['card']
            });
            res.send({clientSecret:paymentIntent.client_secret})
          });
             


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

      app.get('/order/:id',jwtVerified, async(req,res)=>{
        const id=req.params.id;
        const query={_id:ObjectId(id)};
        const result=await orderCollection.findOne(query);
        res.send(result)
      })

      app.get('/order',jwtVerified,async(req,res)=>{
          const query={};
          const result=await orderCollection.find(query).toArray();
          res.send(result)
      })



      app.get('/profile',jwtVerified, async(req,res)=>{
        const email=req.query.email;
       const decodedEmail=req.decoded.email;
       if(email===decodedEmail){
        const query={email : email}
        const user=await profileCollection.findOne(query);
        res.send(user);
       }
       else{
           return res.status(403).send({message:"forbidden"})
       }
     
      
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

        app.patch('/order/:id',jwtVerified,async(req,res)=>{
            const id=req.params.id;
            const payment=req.body;
            const filter={_id:ObjectId(id)}
            const updateDoc={
                $set:{
                    paid:true,
                    transactionId:payment.transactionId
                }
            }
            const result=await paymentCollection.insertOne(payment);
            const updatedOrder=await orderCollection.updateOne(filter,updateDoc);
            res.send(updatedOrder);
        })





        app.delete('/order/:email',  async(req,res)=>{
            const email=req.params.email;
            const filter={email:email}
            const result=await orderCollection.deleteOne(filter);
            res.send(result)
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