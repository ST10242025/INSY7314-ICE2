import './loadEnv.js';
import express from 'express';
import mongoose from 'mongoose';
import routes from './routes/index.js';
import fs from 'fs';
import https from 'https';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import xss from 'xss-clean';

const app = express();
const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/securephoto';
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// Security & logging middleware
app.use(helmet());
app.use(morgan('dev'));

// CORS configuration (adjust origin as needed for your frontend)
const allowedOrigins = [
  'https://localhost:5173', // Vite default
  'http://localhost:5173',
  'https://localhost:3000', // CRA default
  'http://localhost:3000',
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Global rate limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for login route (10 requests per 15 minutes per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

app.use(express.json());
app.use(xss());

app.use('/api', routes);

// Basic route
// app.get('/api', (req, res) => {
//   res.json({ message: 'Hello World from SecurePhoto backend!' });
// });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
    if (USE_HTTPS) {
      const sslOptions = {
        key: fs.readFileSync('./src/localhost-key.pem'),
        cert: fs.readFileSync('./src/localhost.pem'),
      };
      https.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`HTTPS server running on port ${PORT}`);
      });
    } else {
      app.listen(PORT, () => {
        console.log(`HTTP server running on port ${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  }); 