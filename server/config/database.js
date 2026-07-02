const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION_STRING);

    console.log("DB Connection Successfully!");
  } catch (error) {
    console.log("Issue In DB Connection");
    console.error(error);
    process.exit(1);
  }
};
