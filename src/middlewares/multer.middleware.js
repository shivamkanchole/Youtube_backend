import multer from "multer";
// we are creating "diskstorage" not the memory storage , we can say this is a place where we are savign the files which is uploaded
const storage = multer.diskStorage({
    destination: function (req, file, cb) { // cb is callback
      cb(null, './Public/temp') // first is - error, second is - destination to upload files
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  }) // also it returns the file name
  
export const upload = multer(
    { storage }
)
