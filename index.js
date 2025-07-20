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
const workerReviewRouter = require("./routes/worker/workerReviewRoute")
const adminVerificationRouter = require("./routes/admin/adminVerifiicationRoute")
const adminReviewRouter = require("./routes/admin/adminReviewRoue")
const adminRoute = require("./routes/admin/adminRoute")
const customerProfessionRouter = require("./routes/customer/customerProfessionRoute")
const customerWorkerRouter = require("./routes/customer/customerWorkerRoute")
const chatRoutes = require("./routes/chat/chatRoute");
const customerRoute = require("./routes/customer/customerRoute")


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
app.use("/api/admin/verification", adminVerificationRouter)
app.use("/api/admin/review", adminReviewRouter)
app.use("/api/admin/profile", adminRoute)

//Worker CRUD route
app.use("/api/worker", workerJobRouter)
app.use("/api/worker/profile", workerProfileRouter)
app.use("/api/worker/profession", workerProfessionRouter)
app.use("/api/worker/reviews", workerReviewRouter)


//Customer CRUD route
app.use("/api/customer", customerJobRouter)
app.use("/api/customer/profession", customerProfessionRouter)
app.use("/api/customer/worker", customerWorkerRouter)
app.use("/api/customer", customerRoute)


//chat
app.use("/api/chat", chatRoutes);


module.exports = app