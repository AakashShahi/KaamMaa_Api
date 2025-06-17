//imports
require("dotenv").config()
const express = require('express')
const connectDB = require("./config/db")
const userRouter = require("./routes/userRoutes")
const adminUserRoutes = require("./routes/admin/adminUserRoute")
const adminProfessionRoutes = require("./routes/admin/adminProfessionRoute")
const path = require("path")

//Cors Setup
const cors = require("cors")
const app = express();
let corsOptions = {
    origin: "*"
}
app.use(cors(corsOptions))

//Connect Db part
connectDB()

//Accept Json in request
app.use(express.json())


app.use("/uploads", express.static(path.join(__dirname, "uploads")))

//User rgistration/login Route
app.use("/api/auth", userRouter)
app.use("/api/admin/users", adminUserRoutes)
app.use("/api/admin/profession", adminProfessionRoutes)

const PORT = process.env.PORT
app.listen(
    PORT,
    () => {
        console.log("Server Running");
    }
)