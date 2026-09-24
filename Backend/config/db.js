//create a mongodb connection
import mongoose from 'mongoose';

export default async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");
    }
    catch(err){
        console.log("MongoDB connection failed:" , err.message);
    }
}

