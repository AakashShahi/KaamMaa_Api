require("dotenv").config()
const express = require('express')
const connectDB = require("./config/db")
const userRouter = require("./routes/userRoutes")

const app = express();

connectDB()

app.use(express.json())

app.use("/api/auth", userRouter)

const PORT = process.env.PORT
app.listen(
    PORT,
    () => {
        console.log("Server Running");
    }
)