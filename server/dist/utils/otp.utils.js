"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = generateOtp;
exports.hashOtp = hashOtp;
const crypto_1 = __importDefault(require("crypto"));
function generateOtp(length = 6) {
    let otp = "";
    for (let index = 0; index < length; index += 1) {
        otp += crypto_1.default.randomInt(0, 10).toString();
    }
    return otp;
}
function hashOtp(otp) {
    return crypto_1.default.createHash("sha256").update(otp).digest("hex");
}
