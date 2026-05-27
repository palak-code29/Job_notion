const User = require("../models/User");
const OTP = require("../models/OTP");
const otpgenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const Profile = require("../models/Profile");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const mailSender = require("../utils/mailSender");
const PaymentHistory = require("../models/PaymentHistory");

// ======================== SEND OTP ========================
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Email Not Found!",
      });
    }

    // check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(403).json({
        success: false,
        message: "User Already Exists!",
      });
    }

    // generate otp
    let otp = otpgenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // check unique otp
    let result = await OTP.findOne({ otp });

    while (result) {
      otp = otpgenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });

      result = await OTP.findOne({ otp });
    }

    // create otp entry in db
    const otpPayload = { email, otp };

    const otpBody = await OTP.create(otpPayload);

    console.log("OTP Body:", otpBody);

    return res.status(200).json({
      success: true,
      message: "OTP Sent Successfully",
      otp,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================== SIGNUP ========================
exports.signUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      otp,
    } = req.body;

    // validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !accountType ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All Details Required!",
      });
    }

    // password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password Not Matched!",
      });
    }

    // existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User Already Exists!",
      });
    }

    // find recent otp
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);

    if (recentOtp.length === 0) {
      return res.status(400).json({
        success: false,
        message: "OTP Not Found!",
      });
    }

    // validate otp
    if (otp !== recentOtp[0].otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP!",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create profile
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    // create user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,

      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    // payment history for student
    if (accountType === "Student") {
      const newPaymentHistory = await PaymentHistory.create({
        userId: newUser._id,
        paymentHistory: [],
      });

      if (!newPaymentHistory) {
        return res.status(404).json({
          success: false,
          message: "Payment History Not Created!",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "User Registered Successfully!",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================== LOGIN ========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All Details Required!",
      });
    }

    // find user
    const existingUser = await User.findOne({ email }).populate(
      "additionalDetails",
    );

    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "User Not Registered!",
      });
    }

    // password check
    const isPasswordMatched = await bcrypt.compare(
      password,
      existingUser.password,
    );

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password!",
      });
    }

    // jwt payload
    const payload = {
      email: existingUser.email,
      id: existingUser._id,
      accountType: existingUser.accountType,
    };

    // create token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });

    existingUser.token = token;
    existingUser.password = undefined;

    // cookie options
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    // response
    return res.cookie("token", token, options).status(200).json({
      success: true,
      token,
      existingUser,
      message: "User Logged In Successfully!",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Login Failure!",
    });
  }
};

// ======================== CHANGE PASSWORD ========================
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All Fields Required!",
      });
    }

    // find user
    const user = await User.findById(req.user.id);

    // check old password
    const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Old Password Incorrect!",
      });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update password
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
      },
      { new: true },
    );

    // send mail
    try {
      await mailSender(
        updatedUser.email,
        "Password Updated Successfully",
        passwordUpdated(
          updatedUser.email,
          `Password updated successfully for ${updatedUser.firstName} ${updatedUser.lastName}`,
        ),
      );
    } catch (error) {
      console.error("Error while sending email:", error);

      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password Updated Successfully!",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Something Went Wrong While Changing Password!",
    });
  }
};
