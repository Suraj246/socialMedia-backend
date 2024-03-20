import express from 'express'
import newUser from '../models/userModel.js';
const userRouter = express.Router()
import multer from "multer";
import verifyToken from '../middleware/auth.js';
const upload = multer({ dest: "uploads/" })
import mongoose from 'mongoose'

// user signup
userRouter.post("/signup", async (req, res) => {
    const { username, email, password, image, location } = req.body
    try {
        const userExit = await newUser.findOne({ email: email });

        if (userExit) {
            return res.status(409).json({ message: "user already exits" });
        }

        const user = new newUser({ username, email, password });
        const new_created_User = await user.save();
        if (new_created_User) {
            return res.status(201).json({ success: "user successfully created" });
        }
    } catch (err) {
        return res.status(422).json({ message: "error", err });
    }
})

//user login
userRouter.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const userAvailable = await newUser.findOne({
            username: username,
            password: password,
        });
        if (userAvailable) {
            if (userAvailable.password === password && username === userAvailable.username) {
                const token = await userAvailable.generateAuthToken();

                res.status(200).json({
                    token,
                    userId: userAvailable._id,
                    username: userAvailable.username,
                    email: userAvailable.email,
                    location: userAvailable.location,
                    image: userAvailable.image,
                });
            } else {
                res.status(401).json({ message: "incorrect details" });
            }
        }

        else {
            res.status(404).json({ message: "user not found" });
        }
    } catch (err) {
        res.send({ message: err });
    }
});

// get user
userRouter.get('/get-data/:id', async (req, res) => {
    try {
        const data = await newUser.findOne({ _id: req.params.id }).populate("friends", "image username")

        if (data) {
            res.status(201).send({ message: "success", data });
        } else {
            res.status(404).send({ message: "Product failed" });
        }
    } catch (error) {
        res.status(500).send({ message: "server error", error });
    }
})

userRouter.put('/update/:id', verifyToken, upload.single("image"), async (req, res) => {

    const username = req.body.username
    const location = req.body.location
    const image = req.file && req.file.filename
    try {
        const updateUser = await newUser.findByIdAndUpdate({ _id: req.params.id }, { username: username, location: location, image: image }, { new: true });
        if (updateUser) {
            return res.status(201).json({ success: "user updated", updateUser });
        }
        else {
            return res.status(404).json({ success: "failed to update" });
        }
    } catch (error) {
        res.status(500).json({ error: error })
    }
})


userRouter.put("/posts/:id", async (req, res) => {
    const { postId } = req.body

    try {
        const storeLikes = await newUser.updateOne({ _id: req.params.id }, { $addToSet: { posts: postId } })

        if (storeLikes) {
            return res.status(201).json({ success: "liked" });
        }

    } catch (err) {
        return res.status(422).json({ message: "error" });
    }
})

// single user api
userRouter.get("/:id", async (req, res) => {

    try {
        const user = await newUser.findOne({ _id: req.params.id }).populate(
            [{
                path: 'posts',
                model: 'posts',
                populate: { path: "comments", populate: { path: "users", select: 'username image createdAt' } }
            }
            ]
        )
        if (user) {
            return res.status(201).json(user);
        }

    } catch (err) {
        return res.status(422).json({ message: "error" });
    }
})

// user to friends
userRouter.put('/update/friend/:id', verifyToken, upload.single("image"), async (req, res) => {
    try {
        const updateUser = await newUser.findByIdAndUpdate({ _id: req.params.id }, { $addToSet: { friends: req.body.friendId } }, { new: true });

        if (updateUser) {
            return res.status(201).json({ success: "user updated", updateUser });
        }
        else {
            return res.status(404).json({ success: "failed to update" });
        }
    } catch (error) {
        res.status(500).json({ error: error })
    }
})

//user delete post
userRouter.delete('/:id/:friend_index', async (req, res) => {
    const { id, friend_index } = req.params
    try {
        await newUser.findOne({ _id: new mongoose.Types.ObjectId(id) })
            .then((result) => {
                const book = result.friends[friend_index]
                newUser.findOneAndUpdate(
                    { _id: new mongoose.Types.ObjectId(id) },
                    {
                        $pull: {
                            friends: book
                        }
                    },

                    { new: true }
                )
                    .then((result) => {
                        res.status(200).send({ message: "friend removed", result })
                    })
            })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
export default userRouter