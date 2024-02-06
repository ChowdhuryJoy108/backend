import mongoose from 'mongoose'

import {DB_NAME} from '../constants.js'

const connectDB = async ()=>{
    try{
        const connectionIntance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Connected to MongoDB || DB host: ${connectionIntance.connection.host}`)
    }catch(error){  
        console.log(`MongoDB error : ${error}`)

    }
}

export default connectDB

