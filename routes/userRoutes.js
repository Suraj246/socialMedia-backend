import express from 'express'
import newUser from '../models/userModel.js';
const userRouter = express.Router()
import multer from "multer";
import verifyToken from '../middleware/auth.js';
const upload = multer({ dest: "uploads/" })
import mongoose from 'mongoose'
import dotenv from "dotenv";

import nodemailer from 'nodemailer'
dotenv.config({ path: "./config.env" });



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

// forgot password
userRouter.post("/email_validation", async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    const API = "https://social-nu-olive.vercel.app"
    // const API = "http://localhost:3000"
    const resetLink = `${API}/reset_password?email=${encodeURIComponent(email)}`;
    const transporter = nodemailer.createTransport({
        service: "gmail",
        secure: true,
        port: 465,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });

    try {
        const user = await newUser.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email does not exist" });
        }
        // Send reset email
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Reset Password",
            text: `Hello ${user.username},\n\nYour account information:\nUsername: ${user.username}\nLocation: ${user.location}\n\nClick the link below to reset your password:\n${resetLink}`,
            html: `<p>Hello <b>${user.username}</b>,</p>
                   <p>Your reset password link:</p>
                   <a href="${resetLink}">${resetLink}</a>`,
        };

        await transporter.sendMail(mailOptions);
        console.log("Reset email sent to:", email);

        return res.status(200).json({ message: "Email sent successfully", userid: user._id });

    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
});



//reset password
userRouter.put("/reset_password/:id", async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ message: "new password is required" });
    }
    try {
        if (newPassword) {
            const updatedUser = await newUser.findByIdAndUpdate(
                { _id: req.params.id },
                { password: newPassword },
                { new: true }
            );

            return res.status(200).json({ message: "password updated" });

        }

    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({ message: "Internal server error", error });
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