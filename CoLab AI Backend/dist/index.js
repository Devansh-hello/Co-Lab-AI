import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { chat } from "./function.js";
import cors from "cors";
import { User, Content, Tags, chatHistory } from "./db.js";
import { zodMiddleware, authCheck } from "./middleware.js";
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173', // Your React app URL
    credentials: true // Allow cookies
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
        loogedin: true
    });
});
app.post("/api/v1/content", authCheck, async (req, res) => {
    const { title, description, image, tags } = req.body;
    //const newReq = req as unknown as AuthRequest;
    try {
        await Content.create({
            title: title,
            description: description,
            image: image,
            userId: req.userId
        });
        res.status(200).json({
            message: "post created"
        });
    }
    catch {
        res.json({
            message: "unable to create"
        });
    }
});
app.get("/api/v1/content", authCheck, async (req, res) => {
    const userId = req.userId;
    const posts = await Content.find({ userId: userId });
    res.json(posts);
});
app.delete("/api/v1/content", authCheck, async (req, res) => {
    const { id } = req.body;
    try {
        await Content.deleteOne({ _id: id });
        res.status(200).json({
            message: "Post Deleted succesfully"
        });
    }
    catch {
        res.status(400).json({
            message: "Unable to delete post"
        });
    }
});
app.post("/api/v1/chat-message", authCheck, async (req, res) => {
    const message = req.body.message;
    const userId = req.userId;
    try {
        const response = await chat(message);
        chatHistory.create({
            userId: userId,
            output_text: response
        });
        res.status(200).json({
            response
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