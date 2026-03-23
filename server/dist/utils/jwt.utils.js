"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../config/env.config");
// ─── Access Token ──────────────────────────────────────────
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_config_1.env.JWT_ACCESS_SECRET, {
        expiresIn: "15m",
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_config_1.env.JWT_ACCESS_SECRET);
}
// ─── Refresh Token ─────────────────────────────────────────
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_config_1.env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
    });
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_config_1.env.JWT_REFRESH_SECRET);
}
