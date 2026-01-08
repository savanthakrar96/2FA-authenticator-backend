import express from "express";
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

/* =======================
   CORS CONFIG (FIXED)
   ======================= */
const corsOptions = {
  origin: [
    "http://localhost:3001",
    "https://2-fa-authenticator.vercel.app"
  ],
  credentials: true,
};

app.use(cors(corsOptions));

/* =======================
   BODY PARSERS
   ======================= */
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

/* =======================
   SESSION CONFIG
   ======================= */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
      secure: false, // keep false for Render (no HTTPS handling here)
      sameSite: "lax",
    },
  })
);

/* =======================
   PASSPORT
   ======================= */
app.use(passport.initialize());
app.use(passport.session());

/* =======================
   HEALTH CHECK ROUTE
   ======================= */
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "2FA Backend is running 🚀",
  });
});

/* =======================
   API ROUTES
   ======================= */
app.use("/api/auth", authRoutes);

/* =======================
   START SERVER
   ======================= */
const PORT = process.env.PORT || 7002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
