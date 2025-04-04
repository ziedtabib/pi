require("dotenv").config();
const User = require("../models/User");
const UserVerification = require("../models/UserVerification");
const UserOTPVerification = require("../models/UserOTPVerification");
const { google } = require("googleapis");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { euclidean } = require("ml-distance");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const axios = require("axios");
const jwt = require("jsonwebtoken");

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  secure: false,
  tls: { rejectUnauthorized: false },
});

transporter.verify((error) => {
  if (error) console.error("Nodemailer error:", error);
  else console.log("Nodemailer ready to send emails");
});

// User Registration
async function add(req, res) {
  const { name, email, password, recaptchaToken } = req.body;
  const trimmedData = { name: name.trim(), email: email.trim(), password: password.trim() };

  try {
    // Validate reCAPTCHA
    const recaptchaResponse = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      { params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: recaptchaToken } }
    );
    const { success, score } = recaptchaResponse.data;
    if (!success || score < 0.5) {
      return res.json({ status: "FAILED", message: "reCAPTCHA verification failed" });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email: trimmedData.email });
    if (existingUser) {
      return res.json({ status: "FAILED", message: "Email already exists" });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(trimmedData.password, 10);
    const newUser = new User({
      ...trimmedData,
      password: hashedPassword,
      creationDate: new Date(),
      verified: false,
    });

    const savedUser = await newUser.save();
    sendVerificationEmail(savedUser, res);
  } catch (error) {
    console.error("Registration error:", error);
    res.json({ status: "FAILED", message: error.message || "Error during registration" });
  }
}

// User CRUD Operations
async function getAll(req, res) {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
}

async function getById(req, res) {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid User ID format" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getByName(req, res) {
  try {
    const user = await User.findOne({ name: req.params.name });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function update(req, res) {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid User ID format" });
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid User ID format" });
    }
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteAll(req, res) {
  try {
    const result = await User.deleteMany({});
    res.status(200).json({ message: `${result.deletedCount} users deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Password Reset
async function forgotPassword(req, res) {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("Email not found");

    const token = crypto.randomBytes(20).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER || "ghazysaoudi007@gmail.com",
      to: email,
      subject: "🔐 Reset Your Password",
      html: passwordResetTemplate(resetLink),
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send("Check your email for reset instructions");
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).send("Server error");
  }
}

async function resetPassword(req, res) {
  const { token, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });
    if (!user) return res.status(404).send("Invalid or expired token");

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).send("Password updated successfully");
  } catch (error) {
    res.status(500).send("Server error");
  }
}

// Face Authentication
async function faceLogin(req, res) {
  const { facialId } = req.body;
  if (!facialId || typeof facialId !== "string") {
    return res.status(400).json({ message: "Valid Facial ID is required" });
  }

  try {
    const user = await User.findOne({ facialId });
    if (!user) return res.status(404).json({ message: "No user found with this facial ID" });

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Face login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
}

async function registerFace(req, res) {
  const { facialId, name, email } = req.body;
  if (!facialId || !name || !email) {
    return res.status(400).json({ message: "Facial ID, name, and email are required" });
  }

  try {
    if (await User.findOne({ facialId })) {
      return res.status(409).json({ message: "This facial ID is already registered" });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: "This email is already registered" });
    }

    const user = new User({ name, email, facialId, role: "user" });
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({
      message: "Registration successful",
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Face registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
}

// Email Verification
const sendVerificationEmail = async ({ _id, email }, res) => {
  const uniqueString = uuidv4() + _id;
  const verificationUrl = `${process.env.FRONTEND_URL}/courses`;

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify your email",
    html: emailVerificationTemplate(verificationUrl),
  };

  try {
    const hashedUniqueString = await bcrypt.hash(uniqueString, 10);
    await new UserVerification({
      userId: _id,
      uniqueString: hashedUniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 21600000, // 6 hours
    }).save();

    await transporter.sendMail(mailOptions);
    res.json({ status: "PENDING", message: "Verification email sent" });
  } catch (error) {
    res.json({ status: "FAILED", message: "Email send failed" });
  }
};

const sendOTPVerificationEmail = async ({ _id, email }, res) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html: otpVerificationTemplate(otp),
    };

    const hashedOTP = await bcrypt.hash(otp, 10);
    await new UserOTPVerification({
      userId: _id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour
    }).save();

    await transporter.sendMail(mailOptions);
    res.json({
      status: "PENDING",
      message: "OTP verification email sent successfully",
      data: { userId: _id, email },
    });
  } catch (error) {
    res.json({ status: "FAILED", message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    return res.json({ status: "FAILED", message: "Empty OTP details are not allowed" });
  }

  try {
    const records = await UserOTPVerification.find({ userId });
    if (!records.length) {
      return res.json({
        status: "FAILED",
        message: "Account record doesn't exist or has been verified already.",
      });
    }

    const { expiresAt, otp: hashedOTP } = records[0];
    if (expiresAt < Date.now()) {
      await UserOTPVerification.deleteMany({ userId });
      return res.json({ status: "FAILED", message: "Code has expired. Please request again." });
    }

    if (!(await bcrypt.compare(otp, hashedOTP))) {
      return res.json({ status: "FAILED", message: "Invalid code passed. Check your inbox." });
    }

    await User.updateOne({ _id: userId }, { verified: true });
    await UserOTPVerification.deleteMany({ userId });

    const user = await User.findById(userId);
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      status: "VERIFIED",
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.json({ status: "FAILED", message: error.message });
  }
};

const resendOTPVerificationCode = async (req, res) => {
  const { userId, email } = req.body;
  if (!userId || !email) {
    return res.json({ status: "FAILED", message: "Empty user details are not allowed" });
  }

  try {
    await UserOTPVerification.deleteMany({ userId });
    await sendOTPVerificationEmail({ _id: userId, email }, res);
  } catch (error) {
    res.json({ status: "FAILED", message: error.message });
  }
};

// Signin with OTP
const signin = async (req, res) => {
  const { email, password } = req.body;
  const trimmedData = { email: email.trim(), password: password.trim() };

  if (!trimmedData.email || !trimmedData.password) {
    return res.json({ status: "FAILED", message: "Empty credentials supplied!" });
  }

  try {
    const user = await User.findOne({ email: trimmedData.email });
    if (!user) {
      return res.json({ status: "FAILED", message: "Invalid credentials entered!" });
    }
    if (!user.verified) {
      return res.json({ status: "FAILED", message: "Email not verified. Please verify your email first." });
    }
    if (!(await bcrypt.compare(trimmedData.password, user.password))) {
      return res.json({ status: "FAILED", message: "Invalid password entered!" });
    }

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    await sendOTPVerificationEmail(user, res);
    res.json({
      status: "PENDING",
      message: "OTP sent for verification",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.json({ status: "FAILED", message: error.message });
  }
};

// Email Verification (Original)
const verifyEmail = async (req, res) => {
  const { userId, uniqueString } = req.params;

  try {
    const verification = await UserVerification.findOne({ userId });
    if (!verification) return res.redirect(`${process.env.FRONTEND_URL}/team`);

    const match = await bcrypt.compare(uniqueString, verification.uniqueString);
    if (!match) return res.redirect(`${process.env.FRONTEND_URL}/team`);

    await User.updateOne({ _id: userId }, { verified: true });
    await UserVerification.deleteOne({ userId });
    res.redirect(`${process.env.FRONTEND_URL}/team`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/team`);
  }
};

const verifiedPage = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/team`);
};

// HTML Templates
const emailVerificationTemplate = (verificationUrl) => `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
    <h2 style="color: #007bff;">✅ Email Verification</h2>
    <p>Hello,</p>
    <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="${verificationUrl}" style="background-color: #007bff; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
    </div>
    <p>If you did not create this account, you can ignore this email.</p>
    <p>Best regards,<br><strong>The Support Team</strong></p>
  </div>
`;

const passwordResetTemplate = (resetLink) => `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
    <h2 style="color: #d32f2f;">🔒 Password Reset Request</h2>
    <p>Hello,</p>
    <p>You recently requested to reset your password. Click the button below to proceed:</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="${resetLink}" style="background-color: #d32f2f; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>
    <p>If you didn't request this, you can safely ignore this email.</p>
    <p>Best regards,<br><strong>The Support Team</strong></p>
  </div>
`;

const otpVerificationTemplate = (otp) => `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
    <h2 style="color: #007bff;">🔢 Email Verification Code</h2>
    <p>Hello,</p>
    <p>Enter the code below in the app to verify your email address and complete the sign-in process:</p>
    <div style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; padding: 10px; border: 2px dashed #007bff; display: inline-block;">${otp}</div>
    <p>This code <b>expires in 1 hour</b>.</p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Best regards,<br><strong>The Support Team</strong></p>
  </div>
`;

// User Profile and Progress
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const updateUserProgress = async (req, res) => {
  try {
    const { moduleId, moduleName } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { completedModules: { moduleId, moduleName } } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user progress" });
  }
};

const createUserProfile = async (req, res) => {
  const { name, email, password, role, level, completedModules } = req.body;

  try {
    if (!name || !email || !password || !role || !level) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role, level, completedModules });
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user profile:", error);
    res.status(400).json({ error: "Failed to create user profile" });
  }
};

// Social Login (Google Example)
const googleLoginCallback = async (req, res) => {
  try {
    const { token } = req.query;
    const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { sub: googleId, email, name } = response.data;
    let user = await User.findOne({ googleId });

    if (!user) {
      user = new User({ name, email, googleId, role: "user", verified: true });
      await user.save();
    }

    const jwtToken = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${jwtToken}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=${error.message}`);
  }
};

module.exports = {
  add,
  getAll,
  getById,
  getByName,
  update,
  deleteUser,
  deleteAll,
  resetPassword,
  forgotPassword,
  faceLogin,
  registerFace,
  verifyEmail,
  verifiedPage,
  sendOTPVerificationEmail,
  verifyOTP,
  resendOTPVerificationCode,
  signin,
  getUserProfile,
  updateUserProgress,
  createUserProfile,
  googleLoginCallback,
};