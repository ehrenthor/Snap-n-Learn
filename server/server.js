require("dotenv").config();
const db = require("./database/db");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const { requireAuth, requireRole } = require("./authMiddleware");
const http = require('http');
const socketModule = require('./socket');

// Import Routes
const otpRoutes = require("./Entity/Otp");
const imageRoutes = require('./routes/imageRoutes');
const tokenRoutes = require('./Entity/token');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const quizRoutes = require('./routes/quizRoutes');
const imageStatsRoutes = require('./routes/imageStatisticRoutes');
const adminRoutes = require('./routes/adminRoutes'); 

// Define storage directories
const IMAGE_DIR = path.join(__dirname, "uploads/images");
const AUDIO_DIR = path.join(__dirname, "uploads/audio");

// Ensure directories exist
[IMAGE_DIR, AUDIO_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = socketModule.initializeSocket(server);

// Enable CORS
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'https://snapnlearn-7tsv3.ondigitalocean.app'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));

app.use(express.json({
  limit: "50mb", // Allow larger image uploads
}));
app.use(cookieParser());

// Apply global authentication middleware
// This will check all routes except those in publicPaths
// app.use(requireAuth);

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Use Routes
app.use('/api/users', authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/otp", otpRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/chat', imageRoutes);
app.use('/api/users', profileRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/stats', imageStatsRoutes);
app.use("/uploads/images", express.static(path.join(__dirname, "uploads/images")));
app.use('/api/admin', adminRoutes); 

// Chat routes require any authenticated user
// app.use("/api/chat", requireRole(["Adult", "Child", "System Admin"]), llmRoutes);

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'build')));

// For any request that doesn't match an API route or static file,
// send the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Graceful Shutdown Handling
process.on("SIGINT", async () => {
  await db.end();
  process.exit(0);
});

// Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
