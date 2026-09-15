import mongoose from "mongoose";

const dbconnect = async () => {
  try {
    await mongoose.connect(process.env.ATLASURL);
  } catch (error) {
    process.exit(1);
  }
};

export default dbconnect;