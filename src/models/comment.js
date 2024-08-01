import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parent: {
      type: String,
      ref: "Comment",
      default: null
    },
    replies: [
      {
        type: String,
        ref: "Comment"
      }
    ],
    content: {
      type: String,
      required: false,
    },
    like: {
      type: String,
      default: 0
    },

  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
