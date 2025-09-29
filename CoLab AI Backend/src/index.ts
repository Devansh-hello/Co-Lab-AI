import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";

import { User, Project, Message } from "./db.js";
import { zodMiddleware, authCheck } from "./middleware.js";

import("./function.js");

interface AuthRequest extends Request{
    userId?: string;
}

const app = express();
app.use(express.json());

app.use(cookieParser());

app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true 
}));

const JWT_PASSWORD: string = "wioefiowiwhfe897g897e234fw";

app.post("/api/v1/signup", zodMiddleware, async (req,res)=>{

    const {username,email,password}= req.body;

    try{
        await User.create({
            username: username,
            email: email,
            password: password
        })

        res.json({
            Message: "account created"
        })
    }
    catch(error){
        res.status(411).json({
        message: "user already exit"
        })
    }
})
   

app.post("/api/v1/signin",zodMiddleware, async(req,res)=>{
    const {email,password}= req.body;

    const query= await User.findOne({email: email, password:password})

    if (!query){
        res.status(400).json({
            Message: "unable to find user"
        })
    }

    else{
        if (!req.cookies.token){
            const token = jwt.sign({id: query.id}, JWT_PASSWORD);

            res.cookie("token", token).status(200).json({
                message: "Signed in succesfully"
            })
        }else{
            res.json({
                message:"You are already signed in "
            })
        }
        

    }

});
app.get("/api/v1/loggedin", authCheck,(req: any,res)=>{
    res.status(200).json({
        loggedin: true
    })
    
})

app.post("/api/v1/project",authCheck,async (req: any,res)=>{

    const {name, description} = req.body;

    try{
        await Project.create({
            name: name,
            description: description,
            userId: req.userId
        })
        res.status(200).json({
            message:"Project created succesfully"
        })
    }catch{
        res.status(400).json({
            message:"unable to create"
        })
    }
});

app.get("/api/v1/project",authCheck, async (req: any,res)=>{
    const userId = req.userId;
    const posts = await Project.find({userId: userId})

    res.json(
        posts
    )
});



app.post("/api/v1/message",authCheck, async(req:any,res)=>{
    const message = req.body.message;
    const userId = req.userId;

    try{
        Message.create({

            chatId: userId,
            sender: "User",
            content: message
        }
        )

    }
    catch(error){
        res.status(400).json({
            message: "Unable to give output",
            error: error
        })
    }
});
app.get("/api/v1/chat-message",(req,res)=>{
    
});
// Get chat history for a specific chat
app.get("/api/v1/chats/:chatId/messages", authCheck, async (req: any, res) => {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId })
        .sort({ timestamp: 1 })
        .lean();
    
    res.json({ messages });
});


app.get("/api/v1/projects/:projectId/messages", authCheck, async (req: any, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;
        
        console.log("Fetching messages for project:", projectId, "User:", userId);
        
        // Verify user owns the project
        const project = await Project.findOne({ _id: projectId, userId });
        if (!project) {
            console.error("Project not found for user:", userId, "Project:", projectId);
            return res.status(404).json({ error: "Project not found" });
        }
        
        const messages = await Message.find({ projectId })
            .sort({ timestamp: 1 })
            .lean();
        
        console.log("Found", messages.length, "messages for project:", projectId);
        
        res.json({ messages: messages || [] });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ 
            error: "Failed to fetch messages",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
app.listen(5000);