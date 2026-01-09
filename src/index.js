import express, { urlencoded } from "express";
import session from "express-session";
import dotenv from "dotenv";
import passport from "passport";
import cors from "cors";

import dbConnect from "./config/dbConnect.js";
import authRoutes from "./routes/authRoutes.js";
import "./config/passportConfig.js";

dotenv.config();
dbConnect();

const app = express();

/* ===============================
   TRUST PROXY (REQUIRED ON RENDER)
================================ */
app.set("trust proxy", 1);

/* ===============================
   CORS CONFIG (FRONTEND ON VERCEL)
================================ */
const corsOptions = {
  origin: [
    "http://localhost:3001",
    "https://2-fa-authenticator.vercel.app/login" // 👈 replace this
  ],
  credentials: true,
};

app.use(cors(corsOptions));

/* ===============================
   BODY PARSERS
================================ */
app.use(express.json({ limit: "100mb" }));
app.use(urlencoded({ limit: "100mb", extended: true }));

/* ===============================
   SESSION CONFIG (PRODUCTION SAFE)
================================ */
app.use(
  session({
    name: "mfa.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true,
      secure: true,          // REQUIRED (HTTPS)
      sameSite: "none",      // REQUIRED (cross-site)
    },
  })
);

/* ===============================
   PASSPORT
================================ */
app.use(passport.initialize());
app.use(passport.session());

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "2FA Backend is running 🚀",
  });
});

/* ===============================
   ROUTES
================================ */
app.use("/api/auth", authRoutes);

/* ===============================
   SERVER
================================ */
const PORT = process.env.PORT || 7001;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
