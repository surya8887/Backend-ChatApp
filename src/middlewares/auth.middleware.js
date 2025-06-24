import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const jwtVerify = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(new ApiError(401, "Access denied. No token provided."));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new ApiError(401, "Invalid or expired token."));
  }

  const user = await User.findById(decoded._id).select("-password -refreshToken");

  if (!user) {
    return next(new ApiError(401, "User not found."));
  }

  req.user = user; // Attach user to request for downstream use
  next();
});

export default jwtVerify;
