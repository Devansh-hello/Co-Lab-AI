/**
 * Message Model
 *
 * Tracks every user message and the full agent pipeline response.
 * Each field (understandingResponse, coordinatorResponse, etc.) stores
 * the output of the corresponding agent along with a timestamp.
 *
 * Status lifecycle: processing -> completed | error
 */

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true, index: true },
    userMessage: { type: String, required: true },
    intent: { type: String, enum: ['build', 'iterate', 'debug'] },
    timestamp: { type: Date, default: Date.now },

    /** Understanding agent output (summary + clarifying questions) */
    understandingResponse: {
        content: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date }
    },

    /** User's answers to clarifying questions */
    qaAnswers: { type: mongoose.Schema.Types.Mixed },

    /** Orchestrator agent output (task breakdown + API contract) */
    coordinatorResponse: {
        content: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date }
    },

    /** Frontend code agent output */
    frontendResponse: {
        content: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date }
    },

    /** Backend code agent output */
    backendResponse: {
        content: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date }
    },

    /** Review agent output (compatibility checks + setup guide) */
    reviewResponse: {
        content: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date }
    },

    /** Test agent output (test metadata + coverage) */
    testResponse: {
        content: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date }
    },

    /** Computed quality score from the QA-Checker */
    qualityScore: {
        grade: { type: String },
        metrics: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date }
    },

    /** Number of feedback fix iterations performed */
    feedbackIterations: { type: Number, default: 0 },

    /** Orchestrator-assigned complexity rating (1-5) */
    complexityScore: { type: Number },

    status: { type: String, enum: ['processing', 'completed', 'error', 'cancelled'], default: 'processing' }
});

export const Message = mongoose.model("message", messageSchema);
