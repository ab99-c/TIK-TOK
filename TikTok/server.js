import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 8787);
const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
const dataFile = path.join(dataDir, "tiktok.json");
const videoSeed = [
  ["7502551047378832671", "https://www.tiktok.com/@tiktok/video/7502551047378832671"],
  ["7532540099460893983", "https://www.tiktok.com/@tiktok/video/7532540099460893983"],
  ["7623530460693515550", "https://www.tiktok.com/@tiktok/video/7623530460693515550"],
  ["7661266332335263006", "https://www.tiktok.com/@tiktok/video/7661266332335263006"],
];

fs.mkdirSync(dataDir, { recursive: true });
const initialData = { users: [], videos: videoSeed.map(([id, url]) => ({ id, url, title: "", createdAt: new Date().toISOString() })), comments: [], likes: [], messages: [] };
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
const readData = () => JSON.parse(fs.readFileSync(dataFile, "utf8"));
const writeData = (data) => fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
const now = () => new Date().toISOString();

app.use(cors());
app.use(express.json({ limit: "32kb" }));

function getOrCreateUser(data, username = "guest") {
  const normalized = String(username).trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30) || "guest";
  let user = data.users.find((item) => item.username === normalized);
  if (!user) { user = { id: data.users.length + 1, username: normalized, displayName: normalized, createdAt: now() }; data.users.push(user); }
  return user;
}

app.get("/api/health", (_req, res) => res.json({ ok: true, storage: "persistent-json-file" }));

app.get("/api/videos", (_req, res) => {
  const data = readData();
  res.json(data.videos.map((video) => ({ ...video, likes_count: data.likes.filter((like) => like.videoId === video.id).length, comments_count: data.comments.filter((comment) => comment.videoId === video.id).length })));
});

app.post("/api/users", (req, res) => { const data = readData(); const user = getOrCreateUser(data, req.body?.username); writeData(data); res.status(201).json(user); });

app.post("/api/messages", (req, res) => {
  const body = String(req.body?.body || "").trim();
  if (!body || body.length > 500) return res.status(400).json({ error: "الرسالة خاصها تكون بين 1 و500 حرف" });
  const data = readData();
  const user = getOrCreateUser(data, req.body?.username);
  const message = { id: data.messages.length + 1, userId: user.id, username: user.username, body, createdAt: now() };
  data.messages.push(message); writeData(data); res.status(201).json(message);
});

app.get("/api/messages", (_req, res) => { const data = readData(); res.json(data.messages.slice(-50).reverse()); });

app.get("/api/videos/:videoId/comments", (req, res) => {
  const data = readData();
  res.json(data.comments.filter((comment) => comment.videoId === req.params.videoId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

app.post("/api/videos/:videoId/comments", (req, res) => {
  const body = String(req.body?.body || "").trim();
  if (!body || body.length > 500) return res.status(400).json({ error: "التعليق خاصو يكون بين 1 و500 حرف" });
  const data = readData();
  if (!data.videos.some((video) => video.id === req.params.videoId)) return res.status(404).json({ error: "الفيديو غير موجود" });
  const user = getOrCreateUser(data, req.body?.username);
  const comment = { id: data.comments.length + 1, videoId: req.params.videoId, body, username: user.username, displayName: user.displayName, createdAt: now() };
  data.comments.push(comment); writeData(data); res.status(201).json(comment);
});

app.post("/api/videos/:videoId/like", (req, res) => {
  const data = readData();
  if (!data.videos.some((video) => video.id === req.params.videoId)) return res.status(404).json({ error: "الفيديو غير موجود" });
  const user = getOrCreateUser(data, req.body?.username);
  const existingIndex = data.likes.findIndex((like) => like.videoId === req.params.videoId && like.userId === user.id);
  if (existingIndex >= 0) data.likes.splice(existingIndex, 1); else data.likes.push({ videoId: req.params.videoId, userId: user.id, createdAt: now() });
  writeData(data);
  res.json({ liked: existingIndex < 0, likesCount: data.likes.filter((like) => like.videoId === req.params.videoId).length });
});

app.listen(port, () => console.log(`TikTok API running on http://localhost:${port}`));
