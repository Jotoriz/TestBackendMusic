import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    types: {
      type: String,
      required: true,
    },
    id_Types: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
    },
    fileMp3: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      required: true,
    },
    like: {
      type: Number,
      default: 0,
    },
    view: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: true,
    },
    hiddenStatus: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Song = mongoose.model("Song", songSchema);

export default Song;
