import User from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// ================= Register =================

export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Empty field check
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const formattedEmail = email.toLowerCase().trim();

    // Check existing user
    const oldUser = await User.findOne({
      email: formattedEmail,
    });

    if (oldUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Password hash
    const hashPassword = await bcrypt.hash(password, 10);

    // Save user in MongoDB Atlas
    const user = await User.create({
      name: name.trim(),
      email: formattedEmail,
      mobile: mobile.trim(),
      password: hashPassword,
    });


    return res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= Login =================

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const formattedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({
      email: formattedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login Successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= Forgot Password - Send OTP =================

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const formattedEmail = email.toLowerCase().trim();

    // Find registered user
    const user = await User.findOne({
      email: formattedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP valid for 30 seconds
    const otpExpiry = new Date(Date.now() + 30 * 1000);

    // Hash OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpiry = otpExpiry;

    await user.save();

    // Check email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: "Email service is not configured",
      });
    }

    // Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send OTP
    await transporter.sendMail({
      from: `"Exclusive" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Exclusive - Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset OTP</h2>

          <p>
            Use the following OTP to reset your password:
          </p>

          <h1 style="letter-spacing: 8px;">
            ${otp}
          </h1>

          <p>
            This OTP is valid for 30 seconds.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      expirySeconds: 30,
    });
  } catch (error) {


    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= Verify OTP =================

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const formattedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: formattedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    // Check expiry
    if (user.otpExpiry.getTime() < Date.now()) {
      user.otp = null;
      user.otpExpiry = null;

      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please resend OTP.",
      });
    }

    // Compare OTP
    const isOtpCorrect = await bcrypt.compare(
      otp.toString(),
      user.otp
    );

    if (!isOtpCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};