import jwt from "jsonwebtoken"
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        username: { type: String, unique: true },
        email: { type: String },
        password: { type: String },
        image: { type: String },
        location: { type: String },
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "posts" }],
        friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
        tokens: [
            {
                token: {
                    type: String,
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true
    }
)
userSchema.methods.generateAuthToken = async function () {
    try {
        let token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_KEY);
        this.tokens = this.tokens.concat({ token: token });
        await this.save();
        return token;
    } catch (err) {
        console.log(err);
    }
};

const newUser = mongoose.model("user", userSchema)

export default newUser