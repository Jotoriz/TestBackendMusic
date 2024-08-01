import Song from "../models/song.js";
import User from "../models/user.js";
import Comment from "../models/comment.js";
import moment from 'moment';
import { realtimeDatabase } from '../config/firebaseAdmin.js';
import mongoose from "mongoose";

export const createCmt = async (req, res) => {
  try {
    const { actor_id, song_id, content, parent_id } = req.body;

    const song = await Song.findById(song_id);

    if (!song) {
      console.log('Song not found:', song_id);
      return res.status(404).json({ song: "Bài nhạc không tồn tại" });
    }

    const now = moment().format('DD/MM/YYYY HH:mm');

    // Dữ liệu của Realtime
    const commentData = {
      song: song_id,
      actor: actor_id,
      content: content,
      parent: parent_id || null,
      createdAt: now,
      like: 0,
    };

    // Xử lý ký tự không hợp lệ

    const commentId = new mongoose.Types.ObjectId();
    const firebaseCommentId = commentId.toString();

    const commentPath = `comments/${firebaseCommentId}`;
    const likePath = `${commentPath}/like`;
    const contentPath = `${commentPath}/content`;
    const repliesPath = `${commentPath}/replies`;

    // Nếu là bình luận con, cập nhật vào replies của bình luận cha
    if (parent_id) {
      const parentCommentRefRealtime = realtimeDatabase.ref(`comments/${parent_id}/replies/${firebaseCommentId}`);
      await parentCommentRefRealtime.set(commentData);

    } else {
      const commentRefRealtime = realtimeDatabase.ref(`comments/${firebaseCommentId}`);
      await commentRefRealtime.set(commentData);
    }

    // Lưu bình luận vào MongoDB
    const newComment = new Comment({
      _id: commentId,
      song: song_id,
      actor: actor_id,
      content: contentPath,
      like: likePath,
      replies: repliesPath,
      parent: parent_id || null,
    });

    await newComment.save();

    res.status(200).json({ id: firebaseCommentId, ...commentData, newComment });

  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình tạo bình luận" });
  }
};

export const updateCmt = async (req, res) => {
  try {
    const { commentId, content, actorId } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment không tồn tại" });
    }

    if (comment.actor.toString() !== actorId) {
      return res.status(403).json({ error: "Bạn không được sửa bình luận này" });
    }

    // Đường dẫn trong Firebase Realtime Database
    const commentPath = comment.parent
      ? `comments/${comment.parent}/replies/${commentId}`
      : `comments/${commentId}`;

    // Cập nhật nội dung trong Firebase
    const commentRefRealtime = realtimeDatabase.ref(commentPath);
    await commentRefRealtime.child('content').set(content);

    // Cập nhật các thuộc tính khác trong Firebase nếu cần
    const updateFirebase = {
      song: comment.song,
      actor: comment.actor,
      parent: comment.parent || null,
      createdAt: comment.createdAt,
      like: 0,
    };

    await commentRefRealtime.update(updateFirebase);

    // Cập nhật nội dung và likePath trong MongoDB
    comment.content = content;
    comment.like = 0;

    // Lưu comment đã cập nhật vào MongoDB
    const updatedComment = await comment.save();

    res.status(200).json(updateFirebase, updatedComment);
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình cập nhật bình luận" });
  }
};

export const deleteCmt = async (req, res) => {
  try {
    const { commentId, actor } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Bình luận không tồn tại" });
    }

    if (comment.actor.toString() !== actor) {
      return res.status(403).json({ error: "Bạn không có quyền xóa bình luận này" });
    }

    // Xóa bình luận từ Firebase
    const commentRefRealtime = comment.parent
      ? realtimeDatabase.ref(`comments/${comment.parent}/replies/${commentId}`)
      : realtimeDatabase.ref(`comments/${commentId}`);

    await commentRefRealtime.remove();


    // Check xem có cmt cha không, nếu có thì mới được xóa con và xóa cha thì xóa tất cả
    if (!comment.parent) {
      await Comment.deleteMany({ parent: commentId });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({ message: "Đã xóa thành công bình luận" });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình xóa bình luận" });
  }
};

export const deleteCmtByHost = async (req, res) => {
  try {
    const { commentId, actor } = req.body;

    const comment = await Comment.findById(commentId);

    const song = await Song.findOne({ actor });

    if (!comment) {
      return res.status(404).json({ error: "Bình luận không tồn tại" });
    }

    if (!song) {
      return res.status(403).json({ error: "Bạn không có quyền xóa bình luận này" });
    }

    // Xóa bình luận từ Firebase
    const commentRefRealtime = comment.parent
      ? realtimeDatabase.ref(`comments/${comment.parent}/replies/${commentId}`)
      : realtimeDatabase.ref(`comments/${commentId}`);

    await commentRefRealtime.remove();


    // Check xem có cmt cha không, nếu có thì mới được xóa con và xóa cha thì xóa tất cả
    if (!comment.parent) {
      await Comment.deleteMany({ parent: commentId });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({ message: "Đã xóa thành công bình luận" });

  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình xóa bình luận" });
  }
};


