import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";

/**
 * Generate access and refresh tokens for a user
 */
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error(`Error generating tokens: ${error.message}`);
    throw new ApiError(500, "Token generation failed");
  }
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);
};

const signUp = asyncHandler(async (req, res, next) => {
  const { name, username, email, password } = req.body;

  const avatar_data = {
    public_id: "abcddg",
    url: "https://res.cloudinary.com/dfxqzqz4j/image/upload/sample.jpg",
  };

  if (!name || !username || !email || !password) {
    return next(new ApiError(400, "All fields are required", true));
  }

  const existingUser = await User.findOne({
    $or: [{ username: username.trim() }, { email: email.trim() }],
  });

  if (existingUser) {
    return next(new ApiError(400, "Username or email already exists", true));
  }

  const user = await User.create({
    name: name.trim(),
    username: username.trim(),
    email: email.trim(),
    password, // Assuming password hashing is handled in model middleware
    avatar: avatar_data,
  });

  if (!user) {
    return next(new ApiError(400, "Failed to create user", true));
  }

  // Generate access & refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // Set cookies in response
  setTokenCookies(res, accessToken, refreshToken);

  // Select user data to return (omit sensitive info)
  const userData = await User.findById(user._id).select("name username email");

  return res
    .status(201)
    .json(new ApiResponse(201, userData, "User created successfully"));
});

//  login controllers
const login = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  const user = await User.findOne({ $or: [{ username }, { email }] }).select(
    "+password name username email"
  );

  if (!user) {
    return next(new ApiError(401, "Invalid credentials", true));
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    return next(new ApiError(401, "Invalid credentials", true));
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  setTokenCookies(res, accessToken, refreshToken);

  const { name, username: uname, email: userEmail } = user;

  return res.json(
    new ApiResponse(
      200,
      { name, username: uname, email: userEmail },
      "Logged in successfully"
    )
  );
});


// logout controller
const logout = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;

  if (!userId) {
    return next(new ApiError(401, "Unauthorized", true));
  }

  const user = await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  if (!user) {
    return next(new ApiError(404, "User not found", true));
  }

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };

  res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions);

  return res.json(new ApiResponse(200, null, "User logged out successfully"));
});


export { signUp, login, logout };
