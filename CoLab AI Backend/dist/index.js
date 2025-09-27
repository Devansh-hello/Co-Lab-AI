import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import { User, Chats, Project, Message } from "./db.js";
import { zodMiddleware, authCheck } from "./middleware.js";
import("./function.js");
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
const JWT_PASSWORD = "wioefiowiwhfe897g897e234fw";
app.post("/api/v1/signup", zodMiddleware, async (req, res) => {
    const { username, email, password } = req.body;
    try {
        await User.create({
            username: username,
            email: email,
            password: password
        });
        res.json({
            Message: "account created"
        });
    }
    catch (error) {
        res.status(411).json({
            message: "user already exit"
        });
    }
});
app.post("/api/v1/signin", zodMiddleware, async (req, res) => {
    const { email, password } = req.body;
    const query = await User.findOne({ email: email, password: password });
    if (!query) {
        res.status(400).json({
            Message: "unable to find user"
        });
    }
    else {
        if (!req.cookies.token) {
            const token = jwt.sign({ id: query.id }, JWT_PASSWORD);
            res.cookie("token", token).status(200).json({
                message: "Signed in succesfully"
            });
        }
        else {
            res.json({
                message: "You are already signed in "
            });
        }
    }
});
app.get("/api/v1/loggedin", authCheck, (req, res) => {
    res.status(200).json({
        loggedin: true
    });
});
app.post("/api/v1/project", authCheck, async (req, res) => {
    const { title, description } = req.body;
    try {
        await Project.create({
            title: title,
            description: description,
            userId: req.userId
        });
        res.status(200).json({
            message: "Project created succesfully"
        });
    }
    catch {
        res.json({
            message: "unable to create"
        });
    }
});
app.get("/api/v1/project", authCheck, async (req, res) => {
    const userId = req.userId;
    const posts = await Project.find({ userId: userId });
    res.json(posts);
});
app.delete("/api/v1/project", authCheck, async (req, res) => {
    const { id } = req.body;
    try {
        await Project.deleteOne({ _id: id });
        const chatID = await Chats.find({ _id: id });
        const getChatID = chatID.map(c => c._id);
        await Chats.deleteMany({ _id: id });
        await Message.deleteMany(getChatID);
        res.status(200).json({
            message: "Project Deleted succesfully"
        });
    }
    catch {
        res.status(400).json({
            message: "Unable to delete post"
        });
    }
});
app.post("/api/v1/message", authCheck, async (req, res) => {
    const message = req.body.message;
    const userId = req.userId;
    try {
        Message.create({
            chatId: userId,
            sender: "User",
            content: message
        });
    }
    catch (error) {
        res.status(400).json({
            message: "Unable to give output",
            error: error
        });
    }
});
app.get("/api/v1/chat-message", (req, res) => {
});
app.listen(5000);
//# sourceMappingURL=index.js.map