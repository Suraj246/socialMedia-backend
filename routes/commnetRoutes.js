import express from 'express'
import posts from '../models/postsModel.js';
import comment from '../models/commentsModel.js';

const commentRoutes = express.Router()


// create comment
commentRoutes.post("/create/comment/", async (req, res) => {
    const { title, userId } = req.body
    try {
        // if (!title) {
        //     return res.status(422).json({ message: "invalid input" });
        // }
        const postComment = new comment({ title: title })
        const newComment = await postComment.save()
        if (newComment) {
            const storeUser = await comment.findOneAndUpdate({ _id: newComment._id }, { $addToSet: { users: userId } })
            if (storeUser) {
                return res.status(201).json({ success: "comment created", newComment });
            }
            else {
                return res.status(201).json({ success: "could not find the user" });
            }
        }

    } catch (err) {
        return res.status(500).json({ message: "server error" });
    }
})

commentRoutes.put("/comment/:id", async (req, res) => {
    const { commentId } = req.body

    // console.log("comment", req.body)
    // console.log("comment", req.params)

    try {
        const storeComments = await posts.updateOne({ _id: req.params.id }, { $addToSet: { comments: commentId } })



        if (storeComments) {
            const updatedPostComments = await posts.find({})
                .populate([{
                    path: 'user',
                    model: 'user'
                },
                {
                    path: 'comments',
                    model: 'comment',
                    populate: { path: "users", select: 'username image createdAt' }

                }
                ])
            return res.status(201).json({ success: "commented stored in post", updatedPostComments });
        }

    } catch (err) {
        return res.status(422).json({ message: err.message });
    }
})


export default commentRoutes