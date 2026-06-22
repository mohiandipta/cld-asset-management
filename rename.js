require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

function log(type, msg) {
    const colors = {
        info: '\x1b[36m[i]\x1b[0m',
        success: '\x1b[32m[✓]\x1b[0m',
        skip: '\x1b[33m[-]\x1b[0m',
        error: '\x1b[31m[x]\x1b[0m',
    };
    console.log(`${colors[type]} ${msg}`);
}

async function renameAllAssets() {
    let nextCursor = null;

    let total = 0;
    let renamed = 0;
    let skipped = 0;

    log("info", "Starting rename process (only *_xxxxxx assets)...");

    do {
        const result = await cloudinary.api.resources({
            type: 'upload',
            max_results: 500,
            next_cursor: nextCursor,
        });

        log("info", `Fetched ${result.resources.length} assets`);

        for (const resource of result.resources) {
            total++;

            const oldId = resource.public_id;

            // STRICT MATCH: only if ends with _ + 6 alphanumeric chars
            const match = oldId.match(/^(.*)_[a-z0-9]{6}$/i);

            if (!match) {
                skipped++;
                log("skip", `No suffix: ${oldId}`);
                continue;
            }

            const newId = match[1];

            if (!newId || newId === oldId) {
                skipped++;
                log("skip", `Already clean: ${oldId}`);
                continue;
            }

            try {
                log("info", `Renaming: ${oldId} → ${newId}`);

                await cloudinary.uploader.rename(oldId, newId, {
                    overwrite: false,
                    invalidate: true,
                });

                renamed++;
                log("success", `${oldId} → ${newId}`);
            } catch (err) {
                skipped++;
                log("error", `${oldId}: ${err.message}`);
            }
        }

        nextCursor = result.next_cursor;

    } while (nextCursor);

    console.log("\n========== SUMMARY ==========");
    console.log(`Total scanned : ${total}`);
    console.log(`Renamed       : ${renamed}`);
    console.log(`Skipped       : ${skipped}`);
    console.log("=============================\n");
}

renameAllAssets();