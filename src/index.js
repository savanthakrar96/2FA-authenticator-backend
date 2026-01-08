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

//Middlewares
const corsOptions = {
    origin: ["http://localhost:3001"],
    credentials:true,
};
app.use(cors(corsOptions))
app.use(express.json({ limit:"100mb" }));
app.use(urlencoded({limit:"100mb", extended:true}));
app.use(session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge: 60000 * 60,
    }
})
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "2FA Backend is running 🚀"
  });
});


//Routes
app.use("/api/auth", authRoutes);

//Listen app
const PORT = process.env.PORT || 7002;
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
});