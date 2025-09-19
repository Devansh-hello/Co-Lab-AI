import { response } from "express";
import mongoose from "mongoose";
import { string } from "zod";


async function mongo() {
    try{
        await mongoose.connect("mongodb+srv://DevZero:Kamal0342@learn.lzqh8uq.mongodb.net/Brainly");
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
    title: {type:String, required:true},
    description: {type:String},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "user", required: true},
    
})

const chats = new mongoose.Schema({
    projectId: {type: mongoose.Schema.Types.ObjectId, ref: "project", required: true},
    title: {type:String}
})
const message = new mongoose.Schema({
    chatId: {type: mongoose.Schema.Types.ObjectId, ref: "chat", required: true},
    sender:{type:String},
    content: {type:String}
})


export const User = mongoose.model("user", user);
export const Project = mongoose.model("project", project);
export const Chats = mongoose.model("chats", chats);
export const Message = mongoose.model("message", message);