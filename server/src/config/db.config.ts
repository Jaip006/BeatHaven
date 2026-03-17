import mongoose from "mongoose";
import { env } from "./env.config";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      if (error.message.includes("querySrv")) {
        console.error(
          "MongoDB SRV DNS lookup failed. If you are using MongoDB Atlas on a restricted DNS/network, use the non-SRV mongodb:// connection string instead of mongodb+srv://."
        );
      }
    } else {
      console.error(`Unexpected error: ${error}`);
    }

    process.exit(1);
  }
};

export default connectDB;
