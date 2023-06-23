import mongoose from 'mongoose'

const postsSchema = new mongoose.Schema(
    {
        image: { type: String },
        content: { type: String },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
        comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "comment" }],
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user" }
    },
    {
        timestamps: true
    }
)

const posts = mongoose.model("posts", postsSchema)

export default posts