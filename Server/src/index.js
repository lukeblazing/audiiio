// Import the necessary modules using ES module syntax
import 'dotenv/config';
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import { startCronJobs } from './crons/crons.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import AuthController from './authentication/AuthController.js'
import db from './database/db.js';
import webpush from 'web-push';
import multer from 'multer';

// Multer for audio file uploading
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp4'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type'), false);
    }
    cb(null, true);
  }
});

// Create __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Use helmet middleware
app.use(helmet());

// Middleware to parse JSON bodies
app.use(express.json({ limit: '100kb' }));

// Enable cors for prod url
const corsOptions = {
  origin: process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'  // Allow dev frontend on localhost
    : 'https://www.audiiio.com', // Allow production frontend on myapp.com
  credentials: true,               // Enable sending cookies with requests
};

app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
  console.log('CORS enabled for development with localhost:8080');
} else {
  console.log('CORS enabled for production with www.audiiio.com');
}

// Start the cron jobs
startCronJobs();

// Middleware to force HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'development' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Sign up: Create a new user
app.post('/api/signUp', AuthController.verifyAccessCodeToken, async (req, res) => {
  try {

    // temporarily disable sign up
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      error: error.message
    });

    // return await AuthController.createUser(req, res);
  } catch (error) {
    // If there's a server error, return a 500 status code
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      error: error.message
    });
  }
});

// Route for handling login
app.post('/api/login', AuthController.verifyAccessCodeToken, async (req, res) => {
  try {
    return await AuthController.login(req, res);
  } catch (error) {
    // If there's a server error, return a 500 status code
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      error: error.message
    });
  }
});

// Route for handling logout
app.post('/api/logout', AuthController.verifyAccessCodeToken, (req, res) => {
  try {
    return AuthController.logout(req, res);
  } catch (error) {
    // If there's a server error, return a 500 status code
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      error: error.message
    });
  }
});

// Protected route to test authentication from AuthController
app.get('/api/authCheck', AuthController.verifyToken, (req, res) => {
  const userEmail = req.user.email;
  const userRole = req.user.role;
  const userName = req.user.name;

  res.status(200).json({ message: `Welcome ${userEmail}, you are authorized for /protected route as ${userRole}.`, user: req.user });
});

// START ACCESS CODE
app.post('/api/submitAccessCode', async (req, res) => {
  try {
    return await AuthController.submitAccessCode(req, res);
  } catch (error) {
    // If there's a server error, return a 500 status code
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      error: error.message
    });
  }
});

app.get('/api/checkAccessCode', AuthController.verifyAccessCodeToken, (req, res) => {
  res.status(200).json({ message: `Access Code Valid.` });
});
// END ACCESS CODE


// START AUDIO PLAYER ROUTES
// START AUDIO PLAYER ROUTES
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// ------------------------------
// S3 Client (AWS SDK v3)
// ------------------------------
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
    : undefined, // use IAM role if available
});

const AUDIO_BUCKET = process.env.AUDIO_S3_BUCKET;
const MULTIPART_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

// ------------------------------
// GET /api/audio/tracks
// ------------------------------
app.get(
  "/api/audio/tracks",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    const { query = "", page = 1, pageSize = 30 } = req.query;
    const offset = (page - 1) * pageSize;

    try {
      const result = await db.query(
        `
        SELECT *,
               COUNT(*) OVER() AS total
        FROM audio_tracks
        WHERE user_email = $1
          AND (
            title ILIKE $2
            OR artist ILIKE $2
            OR album ILIKE $2
          )
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
        `,
        [req.user.email, `%${query}%`, pageSize, offset]
      );

      res.json({
        items: result.rows.map(r => ({
          id: r.id,
          title: r.title,
          artist: r.artist,
          album: r.album,
          isAudiobook: r.is_audiobook,
        })),
        total: result.rows[0]?.total || 0,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load tracks" });
    }
  }
);

// ------------------------------
// GET /api/audio/tracks/:id/signed-url
// ------------------------------
app.get(
  "/api/audio/tracks/:id/signed-url",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    try {
      const { rows } = await db.query(
        `SELECT audio_key FROM audio_tracks WHERE id=$1 AND user_email=$2`,
        [req.params.id, req.user.email]
      );

      if (!rows.length) return res.sendStatus(404);

      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: AUDIO_BUCKET,
          Key: rows[0].audio_key,
        }),
        { expiresIn: 3600 }
      );

      res.json({ url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to sign URL" });
    }
  }
);

// ------------------------------
// Playback position
// ------------------------------
app.get(
  "/api/audio/playback-position/:trackId",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    const result = await db.query(
      `
      SELECT position_sec, duration_sec
      FROM audio_playback_positions
      WHERE user_email=$1 AND track_id=$2
      `,
      [req.user.email, req.params.trackId]
    );

    res.json(result.rows[0] || {});
  }
);

app.post(
  "/api/audio/playback-position",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    const { trackId, positionSec, durationSec } = req.body;

    await db.query(
      `
      INSERT INTO audio_playback_positions
        (user_email, track_id, position_sec, duration_sec)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (user_email, track_id)
      DO UPDATE SET
        position_sec=$3,
        duration_sec=$4,
        updated_at=now()
      `,
      [req.user.email, trackId, positionSec, durationSec]
    );

    res.sendStatus(204);
  }
);

// ------------------------------
// Multipart upload init
// ------------------------------
app.post(
  "/api/audio/uploads/init",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    const {
      filename,
      mimeType,
      sizeBytes,
      title,
      artist,
      album,
      isAudiobook,
    } = req.body;

    const trackId = uuidv4();
    const audioKey = `audio/${trackId}`;

    try {
      const createCmd = new CreateMultipartUploadCommand({
        Bucket: AUDIO_BUCKET,
        Key: audioKey,
        ContentType: mimeType,
      });

      const { UploadId } = await s3.send(createCmd);

      const partCount = Math.ceil(sizeBytes / MULTIPART_CHUNK_SIZE);

      const parts = await Promise.all(
        Array.from({ length: partCount }).map((_, i) =>
          getSignedUrl(
            s3,
            new UploadPartCommand({
              Bucket: AUDIO_BUCKET,
              Key: audioKey,
              UploadId,
              PartNumber: i + 1,
            }),
            { expiresIn: 900 }
          ).then(url => ({
            partNumber: i + 1,
            url,
          }))
        )
      );

      res.json({
        uploadId: UploadId,
        key: audioKey,
        partSizeBytes: MULTIPART_CHUNK_SIZE,
        parts,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Upload init failed" });
    }
  }
);

// ------------------------------
// Multipart upload complete
// ------------------------------
app.post(
  "/api/audio/uploads/complete",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    const { uploadId, key, parts, metadata } = req.body;

    try {
      await s3.send(
        new CompleteMultipartUploadCommand({
          Bucket: AUDIO_BUCKET,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: parts.map(p => ({
              PartNumber: p.partNumber,
              ETag: p.etag,
            })),
          },
        })
      );

      const trackId = key.split("/")[1];

      const result = await db.query(
        `
        INSERT INTO audio_tracks
          (id, user_email, title, artist, album,
           is_audiobook, audio_key,
           mime_type, size_bytes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
        `,
        [
          trackId,
          req.user.email,
          metadata.title,
          metadata.artist,
          metadata.album,
          metadata.isAudiobook,
          key,
          metadata.mimeType,
          metadata.sizeBytes,
        ]
      );

      res.json({ track: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Upload completion failed" });
    }
  }
);

// ------------------------------
// Playlists
// ------------------------------
app.get(
  "/api/audio/playlists",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    const result = await db.query(
      `
      SELECT p.*, COUNT(i.track_id) AS "itemCount"
      FROM audio_playlists p
      LEFT JOIN audio_playlist_items i
        ON p.id = i.playlist_id
      WHERE p.user_email=$1
      GROUP BY p.id
      `,
      [req.user.email]
    );

    res.json({ items: result.rows });
  }
);

app.post(
  "/api/audio/playlists",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    const id = uuidv4();
    await db.query(
      `INSERT INTO audio_playlists (id, user_email, name)
       VALUES ($1,$2,$3)`,
      [id, req.user.email, req.body.name]
    );
    res.json({ id, name: req.body.name });
  }
);

app.get(
  "/api/audio/playlists/:id",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    const result = await db.query(
      `
      SELECT t.*
      FROM audio_playlist_items i
      JOIN audio_tracks t ON t.id=i.track_id
      WHERE i.playlist_id=$1
      ORDER BY i.position
      `,
      [req.params.id]
    );

    res.json({ items: result.rows });
  }
);

app.post(
  "/api/audio/playlists/:id/items",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    const { trackId } = req.body;

    // Get next position only if inserting
    const posResult = await db.query(
      `
      SELECT COALESCE(MAX(position), 0) + 1 AS p
      FROM audio_playlist_items
      WHERE playlist_id = $1
      `,
      [req.params.id]
    );

    await db.query(
      `
      INSERT INTO audio_playlist_items
        (playlist_id, track_id, position)
      VALUES ($1, $2, $3)
      ON CONFLICT (playlist_id, track_id)
      DO NOTHING
      `,
      [req.params.id, trackId, posResult.rows[0].p]
    );

    res.sendStatus(204);
  }
);


app.delete(
  "/api/audio/playlists/:id/items/:trackId",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    await db.query(
      `
      DELETE FROM audio_playlist_items
      WHERE playlist_id=$1 AND track_id=$2
      `,
      [req.params.id, req.params.trackId]
    );
    res.sendStatus(204);
  }
);

app.delete(
  "/api/audio/playlists/:id",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // Delete playlist items first (FK safety)
      await client.query(
        `DELETE FROM audio_playlist_items WHERE playlist_id = $1`,
        [req.params.id]
      );

      // Delete playlist itself
      const result = await client.query(
        `
        DELETE FROM audio_playlists
        WHERE id = $1 AND user_email = $2
        `,
        [req.params.id, req.user.email]
      );

      await client.query("COMMIT");

      if (result.rowCount === 0) {
        return res.sendStatus(404);
      }

      res.sendStatus(204);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "Failed to delete playlist" });
    } finally {
      client.release();
    }
  }
);

app.delete(
  "/api/audio/tracks/:id",
  AuthController.verifyAccessCodeToken,
  AuthController.verifyToken,
  async (req, res) => {
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `
        SELECT audio_key
        FROM audio_tracks
        WHERE id = $1 AND user_email = $2
        `,
        [req.params.id, req.user.email]
      );

      if (!rows.length) {
        await client.query("ROLLBACK");
        return res.sendStatus(404);
      }

      const { audio_key } = rows[0];

      // Remove playlist references
      await client.query(
        `DELETE FROM audio_playlist_items WHERE track_id = $1`,
        [req.params.id]
      );

      // Remove playback position
      await client.query(
        `DELETE FROM audio_playback_positions WHERE track_id = $1`,
        [req.params.id]
      );

      // Remove track
      await client.query(
        `DELETE FROM audio_tracks WHERE id = $1`,
        [req.params.id]
      );

      await client.query("COMMIT");

      // Delete from S3 (best-effort)
      await s3.send(
        new DeleteObjectCommand({
          Bucket: AUDIO_BUCKET,
          Key: audio_key,
        })
      );

      res.sendStatus(204);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "Failed to delete track" });
    } finally {
      client.release();
    }
  }
);


// import ytDlp from "yt-dlp-exec";
// import fs from "fs";

// app.post(
//   "/api/audio/import",
//   AuthController.verifyAccessCodeToken,
//   AuthController.verifyToken,
//   async (req, res) => {
//     const { url } = req.body;

//     if (!url || typeof url !== "string") {
//       return res.status(400).json({ error: "Missing URL" });
//     }

//     // Create placeholder track
//     const trackId = uuidv4();

//     await db.query(
//       `
//       INSERT INTO audio_tracks
//         (id, user_email, title, album, status)
//       VALUES ($1, $2, $3, $4, 'importing')

//       `,
//       [trackId, req.user.email, "Importing…", "Import"]
//     );

//     // Respond immediately
//     res.status(202).json({ trackId });

//     // Background worker
//     (async () => {
//       const audioKey = `audio/${trackId}.mp3`;
//       const tmpAudio = `/tmp/${trackId}.mp3`;

//       try {
//         // 1️⃣ Extract metadata
//         const info = await ytDlp(url, {
//           dumpSingleJson: true,
//           noWarnings: true,
//           noPlaylist: true,
//         });

//         const title = info.title || "Untitled";
//         const artist = info.uploader || info.channel || "Unknown Artist";

//         // 2️⃣ Download audio WITH progress tracking (CORRECT)
//         const proc = ytDlp.exec(url, {
//           extractAudio: true,
//           audioFormat: "mp3",
//           audioQuality: "0",
//           output: tmpAudio,
//           noPlaylist: true,
//           newline: true,
//           progress: true,
//           forceOverwrites: true,
//           noCheckCertificates: true,
//         });



//         await new Promise((resolve, reject) => {
//           proc.on("close", (code) => {
//             if (code === 0) resolve();
//             else reject(new Error(`yt-dlp exited with code ${code}`));
//           });
//         });

//         const stats = fs.statSync(tmpAudio);

//         // 3️⃣ Upload audio to S3
//         await s3.send(
//           new PutObjectCommand({
//             Bucket: AUDIO_BUCKET,
//             Key: audioKey,
//             Body: fs.createReadStream(tmpAudio),
//             ContentType: "audio/mpeg",
//           })
//         );

//         // 5️⃣ Finalize placeholder → real track
//         await db.query(
//           `
//           UPDATE audio_tracks
//           SET
//             title = $1,
//             artist = $2,
//             album = 'Import',
//             audio_key = $3,
//             status = 'ready'
//           WHERE id = $4
//           `,
//           [title, artist, audioKey, trackId]
//         );


//         console.log(`✅ Import complete: ${title}`);
//       } catch (err) {
//         console.error("❌ Import failed:", err);

//         await db.query(
//           `
//           UPDATE audio_tracks
//           SET status = 'failed'
//           WHERE id = $1
//           `,
//           [trackId]
//         );
//       } finally {
//         try { fs.unlinkSync(tmpAudio); } catch { }
//       }
//     })();
//   }
// );


// END AUDIO PLAYER ROUTES
// END AUDIO PLAYER ROUTES

// Place *after* all routes, before the 404 handler if you have one
app.use((err, req, res, next) => {
  // Multer-specific handling
  if (err instanceof multer.MulterError) {
    // Hide field names, stack, etc.
    return res.status(400).json({ message: 'Upload failed' });
  }

  // Handle other known error types here…

  // Fallback: generic 500 in production, detailed in dev
  const isProd = process.env.NODE_ENV === 'production';
  const payload = isProd
    ? { message: 'Internal server error' }
    : { message: err.message, stack: err.stack };

  console.error(err);          // Always log full stack server‑side
  res.status(500).json(payload);
});


// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../public/build')));

// Catch-all handler to serve the React app
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../public/build/index.html'));
// });

// Start the server
app.listen(PORT, () => {
  console.log('We are about to start this server now.');
  if (process.env.NODE_ENV === 'development') {
    console.log(`Server is running on http://localhost:${PORT}`);
  } else {
    console.log(`Server is running on PORT ${PORT}`);
  }
});
