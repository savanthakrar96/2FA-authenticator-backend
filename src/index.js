import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import dbConnect from "./config/dbConnect.js";
import "./config/passportConfig.js";

dotenv.config();
dbConnect();

const app = express();

/* ===============================
   TRUST PROXY (REQUIRED FOR RENDER)
================================ */
app.set("trust proxy", 1);

/* ===============================
   CORS CONFIG (VERCEL FRONTEND)
================================ */
const corsOptions = {
  origin: "https://2-fa-authenticator.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions)); // ✅ THIS ALONE IS ENOUGH

/* ===============================
   BODY PARSERS
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   SESSION CONFIG
================================ */
app.use(
  session({
    name: "mfa.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60,
    },
  })
);

/* ===============================
   PASSPORT
================================ */
app.use(passport.initialize());
app.use(passport.session());

/* ===============================
   ROUTES
================================ */
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "2FA Backend is running 🚀" });
});

app.use("/api/auth", authRoutes);

/* ===============================
   SERVER
================================ */
const PORT = process.env.PORT || 7001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
