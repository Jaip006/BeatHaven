"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_config_1 = require("./env.config");
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_config_1.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
            if (error.message.includes("querySrv")) {
                console.error("MongoDB SRV DNS lookup failed. If you are using MongoDB Atlas on a restricted DNS/network, use the non-SRV mongodb:// connection string instead of mongodb+srv://.");
            }
        }
        else {
            console.error(`Unexpected error: ${error}`);
        }
        process.exit(1);
    }
};
exports.default = connectDB;
