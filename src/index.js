import connectDB from "./db/index.js";
import * as dotenv from 'dotenv';
import {app} from "./app.js";

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT, ()=>{
        console.log(`listening on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log(`MongoDB connection failed!!! ${err}`)
})






































/*
import * as dotenv from 'dotenv'
import mongoose from  'mongoose'
import express from 'express'
import {DB_NAME} from './constants.js'

dotenv.config();

const app =  express();

//iife 
(async ()=>{
    try{
        const connectionIntance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("Connected to mongoDB" +connectionIntance.connection.host)
        app.listen(`${process.env.PORT}`, (req,res)=>{
            res.send('conected')
        })
    }catch(error){
        console.error("MongoDB Error: " +error)
    }
})()
*/
