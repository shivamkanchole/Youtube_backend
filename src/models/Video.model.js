import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
{
   videoFile:{
    type:String, // from cloudnary url
    require:true,
    index:true
   },
   thumbnail:{
    type:String,
    require:true,
   },
   owner:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
   },
   title:{
    type:String,
    require:true,
   },
   description:{ 
    type:String,
    require:true,
   },
   duration:{ 
    type:Number, // from cloudnary url
    require:true,
   },
   views:{ 
    type:Number,
    default:0,
   },
   isPublished:{ 
    type:Boolean,
    default:true
   },
},
{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate) // we have added a plugin , used latter

export const Video = mongoose.model('Video',videoSchema)