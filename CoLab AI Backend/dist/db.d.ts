import mongoose from "mongoose";
export declare const User: mongoose.Model<{
    username: string;
    email: string;
    password: string;
    userId?: mongoose.Types.ObjectId | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    username: string;
    email: string;
    password: string;
    userId?: mongoose.Types.ObjectId | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    username: string;
    email: string;
    password: string;
    userId?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    username: string;
    email: string;
    password: string;
    userId?: mongoose.Types.ObjectId | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    username: string;
    email: string;
    password: string;
    userId?: mongoose.Types.ObjectId | null;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    username: string;
    email: string;
    password: string;
    userId?: mongoose.Types.ObjectId | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const Project: mongoose.Model<{
    name: string;
    userId: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    description?: string | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    userId: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    description?: string | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    name: string;
    userId: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    description?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    name: string;
    userId: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    description?: string | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    userId: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    description?: string | null;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    name: string;
    userId: mongoose.Types.ObjectId;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    description?: string | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const Message: mongoose.Model<{
    projectId: mongoose.Types.ObjectId;
    userMessage: string;
    timestamp: NativeDate;
    status: "processing" | "completed" | "error";
    coordinatorResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    frontendResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    backendResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    documentationResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    projectId: mongoose.Types.ObjectId;
    userMessage: string;
    timestamp: NativeDate;
    status: "processing" | "completed" | "error";
    coordinatorResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    frontendResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    backendResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    documentationResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    projectId: mongoose.Types.ObjectId;
    userMessage: string;
    timestamp: NativeDate;
    status: "processing" | "completed" | "error";
    coordinatorResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    frontendResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    backendResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    documentationResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    projectId: mongoose.Types.ObjectId;
    userMessage: string;
    timestamp: NativeDate;
    status: "processing" | "completed" | "error";
    coordinatorResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    frontendResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    backendResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    documentationResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    projectId: mongoose.Types.ObjectId;
    userMessage: string;
    timestamp: NativeDate;
    status: "processing" | "completed" | "error";
    coordinatorResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    frontendResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    backendResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    documentationResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    projectId: mongoose.Types.ObjectId;
    userMessage: string;
    timestamp: NativeDate;
    status: "processing" | "completed" | "error";
    coordinatorResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    frontendResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    backendResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
    documentationResponse?: {
        timestamp?: NativeDate | null;
        content?: any;
    } | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=db.d.ts.map