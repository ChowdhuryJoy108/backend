import mongoose,{Schema} from "mongoose";

const likeSchema = new Schema({
    video:{
        type:Schema.Types.ObjectId,
        ref:"video"
    },
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    },
    likeby:{
        type:Schema.Types.ObjectId,
        ref:"USer"
    }
},{timestamps:true})

export const Like = mongoose.model("Like", likeSchema)