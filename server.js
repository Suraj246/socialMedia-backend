import dotenv from "dotenv";
import express from 'express'
import colors from 'colors'
const port = process.env.PORT || 4000
import mongoose from 'mongoose'
import cors from 'cors'
import multer from "multer";
import userRouter from "./routes/userRoutes.js";
import postRoutes from "./routes/postsRoutes.js";
import verifyToken from "./middleware/auth.js";
import commentRoutes from "./routes/commnetRoutes.js";

const upload = multer({ dest: "uploads/" })

dotenv.config({ path: "./config.env" });

const app = express()
app.use('/uploads', express.static('uploads'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors())

//database connection
mongoose.set('strictQuery', true);
mongoose.connect(process.env.DATABASE)
    .then((res) => console.log('> Database Connected...'.bgCyan))
    .catch(err => console.log(`> Error while connecting to mongoDB : ${err.message}`.underline.bgRed))


// routes
app.use("/user", userRouter)
app.use("/user/posts", verifyToken, postRoutes)
app.use("/user/post", verifyToken, commentRoutes)

app.listen(port, () => console.log(`> Server is up and running on port : http://localhost:${port}`.underline.bgMagenta))
