import AppError from "../utils/appError";

const errorHandlerMiddleware = (
  err: any,
  req: any,
  res: any,
  next: () => void
) => {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else {
    error = new AppError(
      err.message || "Something went wrong, try again later",
      err.statusCode || 500
    );
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((item: any) => item.message)
      .join(", ");
    error = new AppError(message, 400, "VALIDATION_ERROR", err.errors);
  }

  // Handle Mongoose duplicate key errors
  if (err.code && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field} already exists`, 400, "DUPLICATE_KEY", {
      field,
      value: err.keyValue[field],
    });
  }

  // Handle MongoDB authorization errors
  if (err.name === "MongoServerError" && err.code === 13) {
    error = new AppError(
      "Database user is missing write permission for this action. Grant readWrite access to the beathaven database for the configured MongoDB user.",
      500,
      "DATABASE_AUTHORIZATION_ERROR",
      err.message
    );
  }

  // Handle Mongoose CastError
  if (err.name === "CastError") {
    error = new AppError(
      `Invalid ${err.path}: ${err.value}`,
      400,
      "CAST_ERROR",
      { path: err.path, value: err.value }
    );
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token", 401, "INVALID_TOKEN");
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Token expired", 401, "TOKEN_EXPIRED");
  }

  const expectedAuthCodes = new Set([
    "REFRESH_TOKEN_MISSING",
    "INVALID_REFRESH_TOKEN",
    "SESSION_INACTIVE",
    "INVALID_TOKEN",
    "TOKEN_EXPIRED",
  ]);
  const shouldLogError =
    process.env.NODE_ENV === "development" ||
    error.statusCode >= 500 ||
    !expectedAuthCodes.has(error.code ?? "");

  if (shouldLogError) {
    console.log("---errorHandlerMiddleware---");
    console.log(err);
  }

  // Build standardized error response
  const response = {
    success: false,
    message: error.message,
    error: {} as any,
  };

  // Add error details if available
  const errorDetails: any = {};

  if (error.code) {
    errorDetails.code = error.code;
  }

  if (error.details) {
    errorDetails.details = error.details;
  }

  // Include stack trace in development mode
  if (process.env.NODE_ENV === "development") {
    errorDetails.stack = error.stack;
  }

  if (Object.keys(errorDetails).length > 0) {
    response.error = errorDetails;
  }

  res.status(error.statusCode).json(response);
};

export default errorHandlerMiddleware;
