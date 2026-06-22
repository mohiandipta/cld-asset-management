require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function renameAllAssets() {
    let nextCursor;

    do {
        const result = await cloudinary.api.resources({
            type: 'upload',
            max_results: 500,
            next_cursor: nextCursor,
        });

        for (const resource of result.resources) {
            const oldId = resource.public_id;

            // Match suffixes like _n7bs8o
            const newId = oldId.replace(/_[a-z0-9]{6}$/, '');

            if (oldId !== newId) {
                try {
                    await cloudinary.uploader.rename(
                        oldId,
                        newId,
                        {
                            overwrite: false,
                            invalidate: true,
                        }
                    );

                    console.log(`✓ ${oldId} -> ${newId}`);
                } catch (err) {
                    console.error(`✗ ${oldId}: ${err.message}`);
                }
            }
        }

        nextCursor = result.next_cursor;
    } while (nextCursor);
}

renameAllAssets();