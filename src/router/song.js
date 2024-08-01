import express from "express";
import upload from '../middlewares/upload.js';
// import { adminMiddleware, requireSignin } from "../common-middleware/index.js";

import {
  createSong,
  updateSong,
  deleteSong,
  hiddenSongofUser,
  unhiddenSongofUser,
  getAllSong,
  getSongById,
  checkActor,

} from "../controller/song.js";

const router = express.Router();

router.post('/song/create', upload.fields([{ name: 'fileMp3', maxCount: 1 }, { name: 'img', maxCount: 1 }]), createSong);
router.put("/song/update/:id", upload.fields([{ name: 'img', maxCount: 1 }]), updateSong);
router.delete("/song/delete/:id", deleteSong);
router.get("/song/hidden/:id", hiddenSongofUser);
router.get("/song/unhidden/:id", unhiddenSongofUser);

router.post("/song/checkActor/:id", checkActor);
router.get("/song/getAll", getAllSong);
router.get("/song/getSongById/:id", getSongById);

export default router;
