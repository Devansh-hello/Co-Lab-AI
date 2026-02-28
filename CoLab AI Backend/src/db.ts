import mongoose from "mongoose";

export async function mongo() {
    try {
        await mongoose.connect(process.env.DATABASE_URL as string);
    } catch (err) {
        console.error("Unable to connect to database", err);
        process.exit(1);
    }
}

const user = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
})

const project = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const message = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true },
    userMessage: { type: String, required: true },
    intent: { type: String, enum: ['build', 'iterate', 'debug'] },
    timestamp: { type: Date, default: Date.now },

    coordinatorResponse: {
        content: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date }
    },
    frontendResponse: {
        content: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date }
    },
    backendResponse: {
        content: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date }
    },
    reviewResponse: {
        content: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date }
    },

    status: { type: String, enum: ['processing', 'completed', 'error'], default: 'processing' }
});

const projectSnapshot = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true, unique: true },
    frontendCode: { type: mongoose.Schema.Types.Mixed },
    backendCode: { type: mongoose.Schema.Types.Mixed },
    taskFile: { type: mongoose.Schema.Types.Mixed },
    updatedAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("user", user);
export const Project = mongoose.model("project", project);
export const Message = mongoose.model("message", message);
export const ProjectSnapshot = mongoose.model("projectSnapshot", projectSnapshot);