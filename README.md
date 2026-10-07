# Backend

This folder contains the server-side application for the Smart Farming System.

## Tech Stack
- Node.js
- Express.js
- MongoDB
- Mongoose

## Purpose
The backend handles API routes, authentication, database operations, and image uploads for the farming system.

## Run locally
1. Open a terminal in this folder.
2. Install dependencies (if available in the project root or backend setup):
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. Ensure MongoDB is running and the connection details in `config/db.js` are correct.

## Main folders
- `config/` - database and configuration files
- `middleware/` - authentication and request middleware
- `models/` - Mongoose data models
- `routes/` - API route definitions
- `uploads/` - uploaded files directory

## Important files
- `server.js` - main Express server entry point
- `config/db.js` - MongoDB connection configuration
- `middleware/auth.js` - authentication middleware
- `routes/authRoutes.js` - authentication endpoints
- `routes/uploadRoutes.js` - upload endpoints
