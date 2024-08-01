import express from "express";
import {
  getAllUser,
  getAll,
  update,
  updatePassword,
  uploadAvatar,
  getByToken,
  deleteUser,
  hiddenUser,
  unhiddenUser,
} from "../controller/user.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// router.get("/user/getAllff", getAll);

router.get("/user/getAll", getAllUser);

router.get("/user/token/:id", getByToken);

router.put("/user/:id", update);

router.delete("/user/delete/:id", deleteUser);

router.get("/user/hidden/:id", hiddenUser);

router.get("/user/unhidden/:id", unhiddenUser);

router.post("/user/changepassword/:id", updatePassword);

router.post("/upload", upload.single("avt"), uploadAvatar);

export default router;
