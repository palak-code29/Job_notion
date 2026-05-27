const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress");

const PaymentHistory = require("../models/PaymentHistory");
const Payments = require("../models/Payments");

const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const Category = require("../models/Category");
const RatingAndReviews = require("../models/RatingAndReviews");

const { uploadImageToCloudinary } = require("../utils/imageUploader");

// ================= UPDATE PROFILE =================
exports.updateProfile = async (req, res) => {
  try {
    const {
      gender = "",
      dateOfBirth = "",
      about = "",
      contactNumber = "",
    } = req.body;

    const user = await User.findById(req.user.id);
    const profileId = user.additionalDetails;

    await Profile.findByIdAndUpdate(profileId, {
      gender,
      dateOfBirth,
      about,
      contactNumber,
    });

    const updatedUser = await User.findById(user._id).populate(
      "additionalDetails",
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Profile update failed",
    });
  }
};

// ================= UPDATE PROFILE PICTURE =================
exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    // check file
    if (!req.files || !req.files.displayPicture) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const file = req.files.displayPicture;

    // upload to cloudinary
    const image = await uploadImageToCloudinary(file, process.env.FOLDER_NAME);

    // update user image
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { image: image.secure_url },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile picture",
    });
  }
};

// ================= REMOVE PROFILE PICTURE =================
exports.removeProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    const defaultImage = `https://api.dicebear.com/5.x/initials/svg?seed=${user.firstName} ${user.lastName}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { image: defaultImage },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Profile picture removed",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove profile picture",
    });
  }
};

// ================= GET USER DETAILS =================
exports.getAllUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("additionalDetails");

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
    });
  }
};

// ================= DELETE ACCOUNT =================
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // delete profile
    await Profile.findByIdAndDelete(user.additionalDetails);

    // student cleanup
    if (user.accountType === "Student") {
      for (const courseId of user.courses) {
        await Course.findByIdAndUpdate(courseId, {
          $pull: { studentsEnrolled: userId },
        });
      }

      await PaymentHistory.findOneAndDelete({ userId });
      await Payments.deleteMany({ userId });
    }

    // instructor cleanup
    if (user.accountType === "Instructor") {
      for (const courseId of user.courses) {
        const course = await Course.findById(courseId);
        if (!course) continue;

        for (const studentId of course.studentsEnrolled) {
          await User.findByIdAndUpdate(studentId, {
            $pull: { courses: courseId },
          });
        }

        await Category.findByIdAndUpdate(course.category, {
          $pull: { courses: courseId },
        });

        for (const sectionId of course.courseContent) {
          const section = await Section.findById(sectionId);

          if (section) {
            for (const subId of section.subSection) {
              await SubSection.findByIdAndDelete(subId);
            }
          }

          await Section.findByIdAndDelete(sectionId);
        }

        await Course.findByIdAndDelete(courseId);
      }
    }

    await RatingAndReviews.deleteMany({ user: userId });
    await CourseProgress.deleteMany({ userId });

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Delete account failed",
    });
  }
};

// ================= GET ENROLLED COURSES =================
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    const userDetails = await User.findById(userId).populate("courses").exec();

    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch enrolled courses",
    });
  }
};

// ================= INSTRUCTOR DASHBOARD DATA =================
exports.instructorDashboardData = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const courses = await Course.find({
      instructor: instructorId,
    });

    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch instructor dashboard data",
    });
  }
};
