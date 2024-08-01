import express from "express";
import {
  createCmt,
  updateCmt,
  deleteCmt,
  deleteCmtByHost,

} from "../controller/comment.js";

const router = express.Router();

router.post("/comment/create", createCmt);
router.put("/comment/update", updateCmt);
router.delete("/comment/delete", deleteCmt);
router.delete("/comment/hostdelete", deleteCmtByHost);

export default router;
