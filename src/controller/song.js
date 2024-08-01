import Song from "../models/song.js";
import User from "../models/user.js";
import { parseBuffer } from 'music-metadata';
import { bucket } from '../config/firebaseAdmin.js';

// import admin from 'firebase-admin';

import pkg from "body-parser";
const { json } = pkg;


export const createSong = async (req, res) => {
  try {

    const { id_Types, title, actor, content } = req.body;


    const fileMp3 = req.files.fileMp3[0];
    const img = req.files.img[0];

    const actorId = await User.findById(actor);
    if (!actorId) {
      return res.status(404).json({ error: "Người dùng không tồn tại." });
    }

    if (!fileMp3 || !img) {
      return res.status(400).json({ error: 'Không có file được tải lên.' });
    }

    // convert file âm thanh ra duration
    const metadata = await parseBuffer(fileMp3.buffer);
    const duration = metadata.format.duration;

    const typesMapping = {
      0: "Chưa chọn",
      1: "RnB",
      2: "Pop",
      3: "Ballad",
      4: "Rap",
      5: "Latin",
      6: "Rock",
    };

    const types = typesMapping[id_Types];

    // Upload fileMp3 lên Firebase Storage
    const fileMp3Upload = bucket.file(`songs/${fileMp3.originalname}`);
    await fileMp3Upload.save(fileMp3.buffer);

    // Check fileMp3 đã load lên Firebase Storage chưa
    const [fileMp3Exists] = await fileMp3Upload.exists();
    if (!fileMp3Exists) {
      return res.status(500).json({ error: 'Tải lên file mp3 thất bại.' });
    }

    // Xử lý tên file hình ảnh để đảm bảo tính duy nhất
    const imgExt = img.originalname.split('.').pop(); // Lấy đuôi file ảnh
    let imgName = `${title}.${imgExt}`;
    let imgUpload = bucket.file(`images/${imgName}`);
    let [imgExists] = await imgUpload.exists();
    let counter = 1;

    while (imgExists) {
      imgName = `${title}${counter}.${imgExt}`;
      imgUpload = bucket.file(`images/${imgName}`);
      [imgExists] = await imgUpload.exists();
      counter++;
    }

    await imgUpload.save(img.buffer);

    // Kiểm tra file hình ảnh đã được tải lên Firebase Storage chưa
    [imgExists] = await imgUpload.exists();
    if (!imgExists) {
      return res.status(500).json({ error: 'Tải lên hình ảnh thất bại.' });
    }

    const fileMp3Url = `https://storage.googleapis.com/${bucket.name}/${fileMp3Upload.name}`;
    const imgUrl = `https://storage.googleapis.com/${bucket.name}/${imgUpload.name}`;

    // Lưu dữ liệu bài hát vào Db
    const newSong = new Song({
      types,
      id_Types,
      title,
      actor,
      content,
      img: imgUrl,
      fileMp3: fileMp3Url,
      duration,
    });

    const savedSong = await newSong.save();

    res.status(201).json(savedSong);

  } catch (error) {
    console.error('Error creating song:', error);
    res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình đăng bài nhạc." });
  }
};


export const checkActor = async (req, res) => {
  try {
    const { actor, id } = req.body;

    const song = await Song.findById(id);

    if (!song) {
      res.status(404).json({ message: "Bài nhạc không tồn tại" });
      return;
    }

    const isMatch = song.actor == actor;

    res.status(200).json(isMatch);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
};

export const updateSong = async (req, res) => {
  try {
    const { id_Types, title, content, actor } = req.body;
    const { id } = req.params;

    const imgUpdate = req.files.img ? req.files.img[0] : null;

    // Khởi tạo dữ liệu cập nhật
    const updatedData = { id_Types, title, content };

    // Tìm bài hát cần cập nhật
    const updatedSong = await Song.findById(id);

    if (!updatedSong) {
      return res.status(404).json({ message: "Bài nhạc không tồn tại" });
    }

    // Kiểm tra quyền sửa bài hát
    const isMatch = updatedSong.actor.equals(actor);
    if (!isMatch) {
      return res.status(403).json({ message: "Bạn không có quyền sửa bài nhạc này" });
    }

    // Xử lý ảnh mới
    if (imgUpdate) {
      const oldImgName = updatedSong.img ? updatedSong.img.split('/').pop() : null;

      // Tạo tên file hình ảnh mới dựa trên tên bài hát và đuôi file
      const imgExt = imgUpdate.originalname.split('.').pop(); // Lấy đuôi file ảnh
      let imgName = `${title}.${imgExt}`;
      let imgUpload = bucket.file(`images/${imgName}`);
      let [imgExists] = await imgUpload.exists();
      let counter = 1;

      while (imgExists) {
        imgName = `${title}${counter}.${imgExt}`;
        imgUpload = bucket.file(`images/${imgName}`);
        [imgExists] = await imgUpload.exists();
        counter++;
      }

      // Xóa ảnh cũ nếu có
      if (oldImgName) {
        const oldImgFile = bucket.file(`images/${oldImgName}`);
        const [oldImgExists] = await oldImgFile.exists();

        if (oldImgExists) {
          await oldImgFile.delete();
        } else {
          console.log(`Old image not found: ${oldImgFile.name}`);
        }
      }

      // Tải ảnh mới lên
      await imgUpload.save(imgUpdate.buffer);
      const imgUrl = `https://storage.googleapis.com/${bucket.name}/${imgUpload.name}`;

      // Cập nhật URL ảnh mới vào updatedData
      updatedData.img = imgUrl;
    }

    // Cập nhật bài hát
    Object.assign(updatedSong, updatedData);

    // console.log('Updated Data:', updatedData);
    // console.log('Updated Song:', updatedSong); 

    // Lưu bài hát đã cập nhật
    const savedSong = await updatedSong.save();

    res.status(200).json(savedSong);
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình cập nhật bài nhạc." });
  }
};


export const deleteSong = async (req, res) => {
  try {

    const { id } = req.params;
    const { actor } = req.query;

    const song = await Song.findById(id);
    if (!song) {
      res.status(404).json({ message: "Bài nhạc không tồn tại" });
      return;
    }

    const isMatch = song.actor == actor;
    if (!isMatch) {
      res.status(403).json({ message: "Bạn không có quyền xóa bài viết này" });
      return;
    }

    // Xóa file nhạc và hình ảnh trong Firebase Storage
    const fileMp3Path = song.fileMp3.split('/').pop();
    const imgPath = song.img.split('/').pop();

    const fileMp3 = bucket.file(`songs/${fileMp3Path}`);
    const fileImg = bucket.file(`images/${imgPath}`);

    const [fileMp3Exists] = await fileMp3.exists();

    if (fileMp3Exists) {
      await fileMp3.delete();
    } else {
      console.log(`File mp3 not found: ${fileMp3.name}`);
    }

    const [fileImgExists] = await fileImg.exists();

    if (fileImgExists) {
      await fileImg.delete();
    } else {
      console.log(`Image file not found: ${imgFile.name}`);
    }

    const deleteSong = await Song.findByIdAndRemove(id);

    if (!deleteSong) {
      res.status(404), json({ message: "Bài nhạc không tồn tại" });
    }

    res.status(200).json("Đã xóa thành công bài viết");
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
};

export const hiddenSongofUser = async (req, res) => {
  try {
    const songId = req.params.id;

    const song = await Song.findById(songId);

    song.hiddenStatus = true;
    await song.save();

    return res.status(200).json({
      success: true,
      message: "Ẩn bài hát thành công",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Máy chủ gặp sự cố",
    });
  }
};

export const unhiddenSongofUser = async (req, res) => {
  try {
    const songId = req.params.id;

    const song = await Song.findById(songId);

    song.hiddenStatus = false;
    await song.save();

    return res.status(200).json({
      success: true,
      message: "Khôi phục bài nhạc thành công",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Máy chủ gặp sự cố",
    });
  }
};

export const getAllSong = async (req, res) => {
  try {
    const song = await Song.find();

    res.status(200).json(song);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
};

export const getSongById = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    res.status(200).json(song);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
};
