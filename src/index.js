import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({
  // we are doing this so that on loading of our aplication as soon as possible hmare env varriable har kisi ko available ho jaye
  path: "./env",
});



connectDB()
  .then(() => {
    const port = process.env.PORT || 3000
    app.listen(port, () => {
      console.log(`server Port started at LocalHost:${port}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB connnection failed: ${error}`);
  });
