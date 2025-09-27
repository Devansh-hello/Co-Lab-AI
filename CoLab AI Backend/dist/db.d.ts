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
    userId: mongoose.Types.ObjectId;
    title: string;
    description?: string | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    userId: mongoose.Types.ObjectId;
    title: string;
    description?: string | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    userId: mongoose.Types.ObjectId;
    title: string;
    description?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    userId: mongoose.Types.ObjectId;
    title: string;
    description?: string | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    userId: mongoose.Types.ObjectId;
    title: string;
    description?: string | null;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    userId: mongoose.Types.ObjectId;
    title: string;
    description?: string | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const Chats: mongoose.Model<{
    projectId: mongoose.Types.ObjectId;
    title?: string | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    projectId: mongoose.Types.ObjectId;
    title?: string | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    projectId: mongoose.Types.ObjectId;
    title?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    projectId: mongoose.Types.ObjectId;
    title?: string | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    projectId: mongoose.Types.ObjectId;
    title?: string | null;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    projectId: mongoose.Types.ObjectId;
    title?: string | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const Message: mongoose.Model<{
    chatId: mongoose.Types.ObjectId;
    sender?: string | null;
    content?: string | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    chatId: mongoose.Types.ObjectId;
    sender?: string | null;
    content?: string | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    chatId: mongoose.Types.ObjectId;
    sender?: string | null;
    content?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    chatId: mongoose.Types.ObjectId;
    sender?: string | null;
    content?: string | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    chatId: mongoose.Types.ObjectId;
    sender?: string | null;
    content?: string | null;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    chatId: mongoose.Types.ObjectId;
    sender?: string | null;
    content?: string | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=db.d.ts.map