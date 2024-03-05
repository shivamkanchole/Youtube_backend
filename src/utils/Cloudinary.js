import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { loadavg } from "os";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// whenever we are ulpoading data over the cloudinary we face some issues thats why always try to use try and catch

const UploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const cloudresponse = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // console.log(cloudresponse)
    console.log("file is uploaded on cloudinary :" + cloudresponse.url);
    fs.unlinkSync(localFilePath)  // unlinksync means files ko phle remove kro then only me aage badunga
    return cloudresponse;
  } catch (error) {
    fs.unlinkSync(localFilePath); // it will remove the locally saved files on when upload opeation got failed on cloudinary , for safe and cleanig purpous
  }
};

export {UploadOnCloudinary}