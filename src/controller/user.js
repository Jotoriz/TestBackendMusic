import User from "../models/user.js";
import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
import Fs from "node:fs/promises";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAll = async (req, res) => {
  try {
    const users = await User.find().select("-hash_password");

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err });
    console.log(err);
  }
};

export const getByToken = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id);
    const { _id, username, email, avt, notification } = user;
    res.status(200).json({ _id, username, email, avt, notification });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const getAllUser = async (req, res) => {
  try {

    const users = await User.find({ hiddenStatus: false });

    if (users.length === 0) {
      return res.status(404).json({ message: "Người dùng không tồn tại hoặc đã bị ẩn" });
    }

    res.status(200).json(users);
  } catch (err) {

    res.status(500).json({ error: err });
  }
};

export const update = async (req, res) => {
  try {
    const updateData = {
      username: req.body.username,
    };
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const updated = await User.findByIdAndUpdate(decoded._id, updateData, {
      new: true,
    });
    if (updated) {
      return res.status(200).json({
        success: true,
        user: updated,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Ban chưa điền đầy đủ thông tin",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "server có vẫn đề soryy",
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const data = {
      oldPassword: req.body.oldPassword,
      newPassWord: req.body.newPassword,
    };

    const userId = req.params.id;

    console.log('User ID:', userId);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    const checkPassword = bcrypt.compareSync(
      data.oldPassword,
      user.hash_password
    );

    console.log('Password Check:', checkPassword);

    if (checkPassword) {
      const newHash_password = await bcrypt.hash(data.newPassWord, 10);

      console.log('New Hashed Password:', newHash_password);

      const updated = await User.findByIdAndUpdate(
        userId,
        { hash_password: newHash_password },
        { new: true }
      );
      if (updated) {
        return res.status(200).json({
          success: true,
          user: updated,
          message: "Đổi mật khẩu thành công",
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Lỗi gì đó",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Sai mật khẩu cũ",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "false",
      message: "sever has problem",
    });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "Bạn chưa đăng nhập hoặc chưa đăng ký",
      });
    }
    const avatar = user.avt;
    const filePath = path.resolve(__dirname, "../" + avatar);

    user.avt = "/public/image/" + req.file.filename;
    await user.save();

    if (
      avatar !=
      "https://a0.anyrgb.com/pngimg/1658/1292/little-boy-icon-little-girl-avatar-ico-icon-design-boy-cartoon-cartoon-character-sitting-cool.png"
    ) {
      await Fs.unlink(filePath);
    }

    res.status(200).json({
      success: true,
      message: "Đã thay avatar thành công",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "server có vẫn đề soryy",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {

    const userId = req.params.id;

    const deleteUser = await User.findByIdAndDelete(userId);
    if (deleteUser) {
      return res.status(200).json({
        success: true,
        message: "Xóa tài khoản thành công",
      });
    }
    else {
      return res.status(400).json({
        success: false,
        message: "Xóa tài khoản không thành xông",
      });
    }
  }
  catch (error) {
    return res.status(500).json({
      status: "false",
      message: "Lỗi sever",
    });
  }
};

export const hiddenUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    user.hiddenStatus = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Ẩn tài khoản thành công",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Máy chủ gặp sự cố",
    });
  }
};

export const unhiddenUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    user.hiddenStatus = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Khôi phục tài khoản thành công",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Máy chủ gặp sự cố",
    });
  }
};





