import { Router } from "express";
import {upload} from '../middlewares/multer.middleware.js'
import {verifyJWT} from '../middlewares/Auth.middleware.js'
import {getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus} from '../controllers/Video.controller.js'

const router = Router()

router.route('/publishAvideo').post(
    upload.fields([
        {
            name: "videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
    verifyJWT,
    publishAVideo
)
router.route('/getallvideos').get(getAllVideos)
router.route('/:videoId').get(getVideoById)
router.route('/update/:videoId').patch(verifyJWT,updateVideo)
router.route('/delete/:videoId').delete(verifyJWT,deleteVideo)
router.route('/:videoId').post(verifyJWT,togglePublishStatus)

export default router