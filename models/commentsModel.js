import mongoose from 'mongoose'

const commentsSchema = new mongoose.Schema(
    {
        title: { type: String },
        users: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    },
    {
        timestamps: true
    }
)

const comment = mongoose.model("comment", commentsSchema)

export default comment