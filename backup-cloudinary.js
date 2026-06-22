require('dotenv').config();

const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const fs = require('fs');
const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function downloadFile(url, filePath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });

    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function backupAll() {
    let nextCursor = null;
    let total = 0;

    do {
        const result = await cloudinary.api.resources({
            type: 'upload',
            max_results: 500,
            next_cursor: nextCursor,
        });

        for (const asset of result.resources) {
            const ext =
                path.extname(asset.secure_url.split('?')[0]) || '.jpg';

            const filePath = path.join(
                'cloudinary-backup',
                `${asset.public_id}${ext}`
            );

            console.log(`Downloading: ${asset.public_id}`);

            try {
                await downloadFile(asset.secure_url, filePath);
                total++;
            } catch (err) {
                console.error(`Failed: ${asset.public_id}`, err.message);
            }
        }

        nextCursor = result.next_cursor;
    } while (nextCursor);

    console.log(`Backup complete. Downloaded ${total} files.`);
}

backupAll().catch(console.error);