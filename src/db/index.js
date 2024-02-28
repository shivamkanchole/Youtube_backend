import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstances = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    ); // we need to pass database url and database name
    console.log(
      `DATABASE Connection succesfull !! DB_HOST:${connectionInstances.connection.host}`
    );
  } catch (error) {
    console.log(`Error in Connectin DataBase: + ${error}`);
    process.exit(1);
  }
};

export default connectDB;