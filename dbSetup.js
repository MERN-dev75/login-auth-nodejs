import mongoose from 'mongoose';
import dotenv from 'dotenv';


dotenv.config();

const connectDB = async () => {
    try {
        const MONGO_URL = process.env.MONGO_URL;
        console.log("connect mongo first...")
        const conn = await mongoose.connect(MONGO_URL, {
            useNewUrlParser: true,        // Ensures the use of the new MongoDB connection string parser.
            useUnifiedTopology: true,     // Enables the new unified topology engine for connection management.
            serverSelectionTimeoutMS: 30000, // Limits the time to 30 seconds for Mongoose to find a MongoDB server.
            socketTimeoutMS: 45000,       // Limits the idle time for the socket to 45 seconds before closing the connection.
          });

        console.log("connect mongo connected success...")
        console.log(`MongoDB connected successfully: ${conn.connection.host}`);
        mongoose.connection.on("connected", () =>
          console.log("Mongoose connection established 💚")
        );
        mongoose.connection.on("error", (err) =>
          console.error("Mongoose connection error:", err)
        );
        mongoose.connection.on("disconnected", () =>
          console.log("Mongoose connection disconnected.")
        );
    } catch (error) {
        console.error("Error during MongoDB connection:", error.message);
        process.exit(1);
    }
}

export default connectDB;