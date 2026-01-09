import bcrypt from "bcryptjs";
import User from "../models/user.js";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

// REGISTER
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword,
      isMfaActive: false,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
};

// LOGIN
export const login = (req, res) => {
  res.status(200).json({
    message: "Login successful",
    _id: req.user._id,
    username: req.user.username,
    isMfaActive: req.user.isMfaActive,
  });
};

// AUTH STATUS
export const authStatus = (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.status(200).json({
    _id: req.user._id,
    username: req.user.username,
    isMfaActive: req.user.isMfaActive,
  });
};

// ✅ LOGOUT (FIXED — NO 401 EVER)
export const logout = (req, res) => {
  req.logout(() => {
    if (req.session) {
      req.session.destroy(() => {
        res.clearCookie("connect.sid", {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });
        return res.status(200).json({ message: "Logout successful" });
      });
    } else {
      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      return res.status(200).json({ message: "Logout successful" });
    }
  });
};

// 2FA SETUP
export const setup2FA = async (req, res) => {
  const secret = speakeasy.generateSecret({ length: 20 });

  req.user.twoFactorSecret = secret.base32;
  await req.user.save();

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  res.status(200).json({
    qrCode,
    secret: secret.base32,
  });
};

// 2FA VERIFY
export const verify2FA = async (req, res) => {
  const { token } = req.body;

  const verified = speakeasy.totp.verify({
    secret: req.user.twoFactorSecret,
    encoding: "base32",
    token,
  });

  if (!verified) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  req.user.isMfaActive = true;
  await req.user.save();

  res.status(200).json({ message: "2FA verified successfully" });
};

// 2FA RESET
export const reset2FA = async (req, res) => {
  req.user.isMfaActive = false;
  req.user.twoFactorSecret = undefined;
  await req.user.save();

  res.status(200).json({ message: "2FA reset successful" });
};
