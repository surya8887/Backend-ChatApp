import connectDB from "./db/db.js";
import app from "./app.js";
import dotenv from "dotenv";

// Load environment variables from .env file in root
dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 3000;

// Connect to DB, then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
  });
