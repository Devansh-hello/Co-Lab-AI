import { response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

async function mongo() {
    try{
        await mongoose.connect(process.env.DATABASE_URL as string);
    }catch(err){
        response.json({
            message: "Unable to connect to database"
        })
    }
}
mongo()

const user = new mongoose.Schema({
    username: {type: String, required: true, unique:true},
    email: {type: String, required: true,unique:true},
    password: {type:String, required: true},
    userId: {type: mongoose.Schema.Types.ObjectId}
})

const project = new mongoose.Schema({
    name: {type: String, required: true},
    description: {type: String},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "user", required: true},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
});

const message = new mongoose.Schema({
    projectId: {type: mongoose.Schema.Types.ObjectId, ref: "project", required: true},
    userMessage: {type: String, required: true},
    timestamp: {type: Date, default: Date.now},
    
    coordinatorResponse: {
        content: {type: mongoose.Schema.Types.Mixed},
        timestamp: {type: Date}
    },
    frontendResponse: {
        content: {type: mongoose.Schema.Types.Mixed},
        timestamp: {type: Date}
    },
    backendResponse: {
        content: {type: mongoose.Schema.Types.Mixed},
        timestamp: {type: Date}
    },
    documentationResponse: {
        content: {type: mongoose.Schema.Types.Mixed},
        timestamp: {type: Date}
    },
    
    status: {type: String, enum: ['processing', 'completed', 'error'], default: 'processing'}
});



export const User = mongoose.model("user", user);
export const Project = mongoose.model("project", project);
export const Message = mongoose.model("message", message);