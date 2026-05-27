require("dotenv").config();
const express = require("express");
const app = express();

const userRoutes = require("./routes/User");
const paymentsRoutes = require("./routes/Payments");
const profileRoutes = require("./routes/Profile");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");

const { cloudinaryConnect } = require("./config/cloudinary");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const database = require("./config/database");

const PORT = process.env.PORT || 4000;

// ✅ ENV CHECK LOGS
console.log("PORT:", process.env.PORT);
console.log("DB URL:", process.env.DATABASE_URL);
console.log("JWT SECRET:", process.env.JWT_SECRET);

// ✅ Connecting to database
database.connect();

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

// ✅ File Upload Middleware
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./tmp",
  }),
);

// ✅ Connecting to cloudinary
cloudinaryConnect();

// ✅ Routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentsRoutes);
app.use("/api/v1/reach", contactUsRoute);

// ✅ Testing route
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your server is up and running ...",
  });
});

// ✅ Server start
app.listen(PORT, () => {
  console.log(`App is listening at ${PORT}`);
});
