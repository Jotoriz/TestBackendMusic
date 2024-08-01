import admin from 'firebase-admin';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';
import { writeFileSync, existsSync } from 'fs';
import axios from 'axios';

// Chuyển đổi từ URL sang đường dẫn file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Đường dẫn URL tới serviceAccountKey.json
const serviceAccountUrl = '../../serviceAccountKey.json';
// Đường dẫn cục bộ để lưu trữ serviceAccountKey.json
const localPath = resolve(__dirname, '../../serviceAccountKey.json');

// Tải tệp serviceAccountKey.json từ URL và lưu trữ cục bộ
async function downloadServiceAccountKey() {
    try {
        const response = await axios.get(serviceAccountUrl, { responseType: 'arraybuffer' });
        writeFileSync(localPath, response.data);
        console.log('Tệp serviceAccountKey.json đã được tải xuống và lưu trữ thành công.');
    } catch (error) {
        console.error('Lỗi khi tải tệp serviceAccountKey.json:', error.message);
        throw new Error('Tải tệp thất bại');
    }
}

// Kiểm tra và tải tệp nếu chưa tồn tại
if (!existsSync(localPath)) {
    await downloadServiceAccountKey();
} else {
    console.log('Tệp serviceAccountKey.json đã tồn tại.');
}

// Đường dẫn tương đối đến serviceAccountKey.json
const relativeServiceAccountPath = resolve(__dirname, '../../serviceAccountKey.json');

// Sử dụng đường dẫn tương đối để import tệp JSON
const serviceAccount = await import(pathToFileURL(relativeServiceAccountPath).href, {
    assert: { type: 'json' }
}).then(module => module.default)
    .catch(error => {
        console.error('Lỗi khi import tệp serviceAccountKey.json:', error.message);
        throw new Error('Import tệp thất bại');
    });

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://musicapp-77d88-default-rtdb.firebaseio.com',  // URL của Realtime Database
    storageBucket: 'musicapp-77d88.appspot.com'
});

const firestore = admin.firestore();
const realtimeDatabase = admin.database();
const bucket = admin.storage().bucket();

export { firestore, realtimeDatabase, bucket };
