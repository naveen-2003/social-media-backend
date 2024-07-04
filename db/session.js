import mongoose from "mongoose";

const dbSession = async () => {
  return await mongoose.startSession();
};

export default dbSession;
