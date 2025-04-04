require("dotenv").config();
const express = require("express");
const mongo = require("mongoose");
const session = require("express-session");
const passport = require("./config/passport"); // Import your passport configuration
const cors = require("cors");
const crypto = require("crypto");
const path = require("path"); // For static file serving consistency
const jwt = require("jsonwebtoken");

const config = require("./config/dbconnexion.json");

// MongoDB connection
mongo
  .connect(config.url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("Database connected"))
  .catch(() => console.log("Database not connected"));

const UserRoutes = require("./routes/User.js");
const courseRoutes = require("./routes/Course.js");
const questionRoutes = require("./routes/Questions.js");
const reponseRoutes = require("./routes/Response.js");
const quizRoutes = require("./routes/Quiz.js");
const scoreQuizRoutes = require("./routes/ScoreQuiz.js");

const app = express();

// Set view engine
app.set("view engine", "ejs");

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all routes
app.use(cors({
  origin: process.env.FRONTEND_URL, // Allow requests from your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

// Static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Session secret from .env
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Routes for social login
// Google login
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const jwtToken = generateJWTToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/course?token=${jwtToken}`);
  }
);

// Facebook login
app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req, res) => {
    const jwtToken = generateJWTToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/course?token=${jwtToken}`);
  }
);

// GitHub login
app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    const jwtToken = generateJWTToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/course?token=${jwtToken}`);
  }
);

// LinkedIn login
app.get("/auth/linkedin", passport.authenticate("linkedin", { scope: ["email"] }));

app.get(
  "/auth/linkedin/callback",
  passport.authenticate("linkedin", { failureRedirect: "/login" }),
  (req, res) => {
    const jwtToken = generateJWTToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/course?token=${jwtToken}`);
  }
);

// Current user (for testing if user is authenticated)
app.get("/auth/current_user", (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// JWT Token Generation
function generateJWTToken(user) {
  const payload = { id: user._id, email: user.email };
  const secret = process.env.JWT_SECRET;
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}
// Example login route
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  // Successful login, session is automatically created here by passport
  console.log("Session Info:", req.session);
  res.redirect('/dashboard'); // Redirect to the dashboard or wherever you want
});

// Mount Routes
app.use("/user", UserRoutes);
app.use("/course", courseRoutes);
app.use("/questions", questionRoutes);
app.use("/reponses", reponseRoutes);
app.use("/quiz", quizRoutes);
app.use("/scoreQuiz", scoreQuizRoutes);

// Start server
const server = app.listen(3000, () => console.log("Server running on port 3000"));

module.exports = app;
