import { connect } from "mongoose";

const connectDB = async (url) => {
  return await connect(url);
};

export default connectDB;
