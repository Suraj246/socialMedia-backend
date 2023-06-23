import jwt from "jsonwebtoken"

const verifyToken = (req, res, next) => {
    try {
        const token = req.headers['authorization']
        if (token) {
            jwt.verify(token, process.env.JWT_KEY, (err, result) => {
                if (err) {
                    return res.status(400).json({ message: "provide valid token" })
                }

                next()
            })
        }
        else {
            return res.status(401).json({ message: "no token found" })
        }
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export default verifyToken