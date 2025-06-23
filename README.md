# Backend-ChatApp

## Project Overview
Backend-ChatApp is a backend server for a chat application built with Node.js, Express, and MongoDB. It provides RESTful APIs for user management and supports real-time communication using Socket.io. The backend handles user authentication with JWT, password hashing, file uploads, and media management with Cloudinary.

## Technologies Used
- Node.js
- Express
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Socket.io for real-time communication
- Cloudinary for media management
- Multer for file uploads
- dotenv for environment variable management
- cors for Cross-Origin Resource Sharing
- express-validator for input validation

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher recommended)
- MongoDB instance (local or cloud)
- Cloudinary account (optional, for media uploads)

### Installation
1. Clone the repository:

2. Install dependencies:

3. Create a `.env` file in the root directory with the following variables:

### Running the Server
- For development with auto-reload:
- For production:


The server will start on the port specified in `.env` (default 3000).

## API Endpoints

### User Routes
- `GET /api/v1/users/sign-up`  
Placeholder endpoint for user signup (currently returns a success message).

## Project Structure
- `src/index.js` - Server entry point, connects to DB and starts the app.
- `src/app.js` - Express app setup with middleware and routes.
- `src/db/db.js` - MongoDB connection setup.
- `src/models/` - Mongoose models (User, Chat, Message, Request).
- `src/controllers/` - Route handlers (e.g., user.controller.js).
- `src/routes/` - Express route definitions.
- `src/middlewares/` - Custom middleware (auth, error handling, multer).
- `src/utils/` - Utility classes and functions (ApiError, ApiResponse, asyncHandler, cloudinary).
- `public/` - Static files served by Express.

## Error Handling
The backend uses a centralized error handling middleware that returns JSON responses with error details and stack traces in development mode.

## Author
Vijay Kumar

---

This README provides an overview and instructions to get started with the Backend-ChatApp backend server. For further development, the user signup logic and other features need to be implemented.

