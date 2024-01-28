import connectDB from "./db/index.js";


connectDB()







































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
