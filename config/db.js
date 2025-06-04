require("dotenv").config()
const mongoose = require("mongoose")
const CONNECTION_STRING = process.env.MONGODB_URI
const connectDB = async () => {
    try {
        await mongoose.connect(
            CONNECTION_STRING,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        )
        console.log("Mongodb connected");
    } catch (error) {
        console.log("DB error", error);
    }
}

module.exports = connectDB