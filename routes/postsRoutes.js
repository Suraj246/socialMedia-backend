import express from 'express'
import mongoose from 'mongoose'
const postRoutes = express.Router()
import multer from "multer";
import posts from '../models/postsModel.js';
import newUser from '../models/userModel.js';
const upload = multer({ dest: "uploads/" })


// create posts
postRoutes.post("/create", upload.single("image"), async (req, res) => {
    const { content, userId } = req.body
    const image = req.file ? req.file.filename : "no image"
    try {
        const post = new posts({ image, content });
        const new_post = await post.save();
        if (new_post) {
            const store = await posts.updateOne({ _id: new_post._id }, { $addToSet: { user: userId } });
            // console.log(store)
            if (store) {
                return res.status(201).json({ success: "user stored", new_post });
            }
            return res.status(201).json({ success: "post created successfully" });
        }

    } catch (err) {
        return res.status(422).json({ message: "error" });
    }
})

//get all posts
postRoutes.get('/posts', async (req, res) => {
    try {
        await posts.find({}).populate([{
            path: 'user',
            model: 'user'
        },
        {
            path: 'comments',
            model: 'comment',
            populate: { path: "users", select: 'username image createdAt' }

        }
        ])
            .then((result) => {
                res.status(200).json(result)
            })
            .catch((error) => {
                res.status(499).json(error)
            })

    } catch (error) {
        res.status(500).send({ error: "server error", error });
    }
})
//  posts likes
postRoutes.put("/like/:id", async (req, res) => {
    const { userId } = req.body

    try {
        const post = await posts.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const liked = post.likes.includes(userId);
        if (liked) {
            await posts.findByIdAndUpdate(req.params.id, { $pull: { likes: userId } }, { new: true });
            return res.status(201).json({ success: "disliked" });
        } else {
            await posts.findByIdAndUpdate(req.params.id, { $addToSet: { likes: userId } }, { new: true });
            return res.status(201).json({ success: "liked" });
        }
    } catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
})

//user delete post
postRoutes.delete('/:id/:postId/:post_index', async (req, res) => {
    const { id, post_index, postId } = req.params
    try {
        await newUser.findOne({ _id: new mongoose.Types.ObjectId(id) })
            .then((result) => {
                const book = result.posts[post_index]
                newUser.findOneAndUpdate(
                    { _id: new mongoose.Types.ObjectId(id) },
                    {
                        $pull: {
                            posts: book
                        }
                    },

                    { new: true }
                )
                posts.findByIdAndDelete({ _id: postId })
                    .then((result) => {
                        res.status(200).send({ message: "user", result })
                    })
            })

    } catch (error) {
        res.status(500).send({ message: error.message })

    }
})

export default postRoutes