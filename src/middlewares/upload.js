import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

// Hàm kiểm tra loại tệp tin
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'fileMp3') {
    const filetypes = /\.(mp3|wav)$/i;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    console.log('fileMp3 - extname:', path.extname(file.originalname).toLowerCase());

    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file mp3 hoặc wav'));
    }
  } else if (file.fieldname === 'img') {
    const filetypes = /\.(svg|jpg|jpeg|png)$/i;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    console.log('img - extname:', path.extname(file.originalname).toLowerCase());

    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh svg, jpg, jpeg, hoặc png'));
    }
  } else {
    return cb(new Error('Loại tệp không được chấp nhận'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100000000 } // 10MB
});

export default upload;
