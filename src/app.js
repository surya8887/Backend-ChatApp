import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middlewares/error.middleware.js";

import { createUser } from "./seeders/user.seeder.js";

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// index router
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Surya's Page</title>
    <style>
    body {
      background-color: #0f172a;
      color: #facc15;
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    h1 {
      font-size: 3rem;
    }
    </style>
    </head>
    <body>
        <h1>This is Index Page and Server is Running</h1>
    </body>
    </html>
  `);
});

// createUser(10)

// Routers
import userRouter from "./routes/user.route.js";
import chatRouter from "./routes/chat.route.js";

// API Endpoints
app.use("/api/v1/users", userRouter);
app.use("/api/v1/chats", chatRouter);

// Error handling middleware
app.use(errorMiddleware);

export default app;
