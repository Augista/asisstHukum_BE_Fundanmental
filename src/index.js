const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

dotenv.config();
const prisma = new PrismaClient();
const app = express();

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, "..", "public")));

// Import routers and middleware
const apiRouter = require('./routes/route');
const errorHandler = require('./middleware/errorHandler');



// Mount API routes
app.use('/api', apiRouter);

// HTML routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "dashboard.html"));
});

// Error handler middleware (must be after all routes)
app.use(errorHandler);

// Catch-all route for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
