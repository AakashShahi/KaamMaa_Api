//imports
require("dotenv").config()
const express = require('express')
const connectDB = require("./config/db")
const userRouter = require("./routes/userRoutes")
const adminUserRoutes = require("./routes/admin/adminUserRoute")
const adminProfessionRoutes = require("./routes/admin/adminProfessionRoute")
const customerJobRouter = require("./routes/customer/customerJobRoute")
const workerJobRouter = require("./routes/worker/workerJobRoute")
const workerProfileRouter = require("./routes/worker/workerProfileRoute")
const workerProfessionRouter = require("./routes/worker/workerProfessionRoute")

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

//Admin Management
app.use("/api/admin/users", adminUserRoutes)
app.use("/api/admin/profession", adminProfessionRoutes)

//Worker CRUD route
app.use("/api/worker", workerJobRouter)
app.use("/api/worker/profile", workerProfileRouter)
app.use("/api/worker/profession", workerProfessionRouter)


//Customer CRUD route
app.use("/api/customer", customerJobRouter)


module.exports = app