import express from "express";

import {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
} from "../controllers/UserController.js";

const router = express.Router();


// ================= Register =================

router.post("/register", registerUser);


// ================= Login =================

router.post("/login", loginUser);


// ================= Forgot Password - Send OTP =================

router.post(
  "/forgot-password",
  forgotPassword
);


// ================= Verify OTP =================

router.post(
  "/verify-otp",
  verifyOtp
);


export default router;