-- Run this file once in Supabase SQL Editor.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(32) PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(32) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body VARCHAR(500) NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
  video_id VARCHAR(32) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (video_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body VARCHAR(500) NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO videos (id, url) VALUES
  ('7502551047378832671', 'https://www.tiktok.com/@tiktok/video/7502551047378832671'),
  ('7532540099460893983', 'https://www.tiktok.com/@tiktok/video/7532540099460893983'),
  ('7623530460693515550', 'https://www.tiktok.com/@tiktok/video/7623530460693515550'),
  ('7661266332335263006', 'https://www.tiktok.com/@tiktok/video/7661266332335263006')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS comments_video_idx ON comments(video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_created_idx ON messages(created_at DESC);
