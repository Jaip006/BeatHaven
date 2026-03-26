"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSeller = exports.requireAuth = void 0;
const appError_1 = __importDefault(require("../utils/appError"));
const jwt_utils_1 = require("../utils/jwt.utils");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
exports.requireAuth = (0, asyncHandler_1.default)(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new appError_1.default("Not authorized, no token", 401, "UNAUTHORIZED");
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = (0, jwt_utils_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch (err) {
        throw new appError_1.default("Not authorized, token failed", 401, "UNAUTHORIZED");
    }
});
exports.requireSeller = (0, asyncHandler_1.default)(async (req, res, next) => {
    if (req.user?.role !== "seller") {
        throw new appError_1.default("Not authorized as a seller", 403, "FORBIDDEN");
    }
    next();
});
