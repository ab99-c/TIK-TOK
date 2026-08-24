import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import pg from "pg";

const { Pool } = pg;
dotenv.config();
const app = express();
const port = Number(process.env.PORT || 8787);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const videoSeed = [
  ["7502551047378832671", "https://www.tiktok.com/@tiktok/video/7502551047378832671"],
  ["7532540099460893983", "https://www.tiktok.com/@tiktok/video/7532540099460893983"],
  ["7623530460693515550", "https://www.tiktok.com/@tiktok/video/7623530460693515550"],
  ["7661266332335263006", "https://www.tiktok.com/@tiktok/video/7661266332335263006"],
];

async function initDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(30) UNIQUE NOT NULL, display_name VARCHAR(100) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS videos (id VARCHAR(32) PRIMARY KEY, url TEXT NOT NULL, title TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, video_id VARCHAR(32) REFERENCES videos(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, body VARCHAR(500) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS likes (video_id VARCHAR(32) REFERENCES videos(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY (video_id, user_id));
    CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, body VARCHAR(500) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
  `);
  for (const [id, url] of videoSeed) await pool.query("INSERT INTO videos (id, url) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING", [id, url]);
}

async function getOrCreateUser(username = "guest") {
  const normalized = String(username).trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30) || "guest";
  const result = await pool.query("INSERT INTO users (username, display_name) VALUES ($1, $1) ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username RETURNING *", [normalized]);
  return result.rows[0];
}

app.use(cors());
app.use(express.json({ limit: "32kb" }));
app.get("/api/health", async (_req, res) => { try { const result = await pool.query("SELECT NOW() AS time"); res.json({ ok: true, database: "postgresql", time: result.rows[0].time }); } catch (error) { res.status(503).json({ ok: false, error: error.message }); } });
app.get("/api/videos", async (_req, res) => { const result = await pool.query("SELECT v.*, COUNT(DISTINCT l.user_id)::int AS likes_count, COUNT(DISTINCT c.id)::int AS comments_count FROM videos v LEFT JOIN likes l ON l.video_id = v.id LEFT JOIN comments c ON c.video_id = v.id GROUP BY v.id ORDER BY v.created_at, v.id"); res.json(result.rows); });
app.post("/api/users", async (req, res) => { res.status(201).json(await getOrCreateUser(req.body?.username)); });
app.get("/api/messages", async (_req, res) => { const result = await pool.query("SELECT m.id, m.body, m.created_at, u.username FROM messages m JOIN users u ON u.id = m.user_id ORDER BY m.created_at DESC LIMIT 50"); res.json(result.rows); });
app.post("/api/messages", async (req, res) => { const body = String(req.body?.body || "").trim(); if (!body || body.length > 500) return res.status(400).json({ error: "الرسالة خاصها تكون بين 1 و500 حرف" }); const user = await getOrCreateUser(req.body?.username); const result = await pool.query("INSERT INTO messages (user_id, body) VALUES ($1, $2) RETURNING id, user_id, body, created_at", [user.id, body]); res.status(201).json({ ...result.rows[0], username: user.username }); });
app.get("/api/videos/:videoId/comments", async (req, res) => { const result = await pool.query("SELECT c.id, c.video_id, c.body, c.created_at, u.username, u.display_name FROM comments c JOIN users u ON u.id = c.user_id WHERE c.video_id = $1 ORDER BY c.created_at DESC", [req.params.videoId]); res.json(result.rows); });
app.post("/api/videos/:videoId/comments", async (req, res) => { const body = String(req.body?.body || "").trim(); if (!body || body.length > 500) return res.status(400).json({ error: "التعليق خاصو يكون بين 1 و500 حرف" }); const user = await getOrCreateUser(req.body?.username); const result = await pool.query("INSERT INTO comments (video_id, user_id, body) VALUES ($1, $2, $3) RETURNING id, video_id, body, created_at", [req.params.videoId, user.id, body]); res.status(201).json({ ...result.rows[0], username: user.username, display_name: user.displayName }); });
app.post("/api/videos/:videoId/like", async (req, res) => { const user = await getOrCreateUser(req.body?.username); const existing = await pool.query("SELECT 1 FROM likes WHERE video_id = $1 AND user_id = $2", [req.params.videoId, user.id]); if (existing.rowCount) await pool.query("DELETE FROM likes WHERE video_id = $1 AND user_id = $2", [req.params.videoId, user.id]); else await pool.query("INSERT INTO likes (video_id, user_id) VALUES ($1, $2)", [req.params.videoId, user.id]); const count = await pool.query("SELECT COUNT(*)::int AS count FROM likes WHERE video_id = $1", [req.params.videoId]); res.json({ liked: !existing.rowCount, likesCount: count.rows[0].count }); });

initDatabase().then(() => app.listen(port, () => console.log(`TikTok PostgreSQL API running on port ${port}`))).catch((error) => { console.error("Database initialization failed:", error.message); process.exit(1); });
