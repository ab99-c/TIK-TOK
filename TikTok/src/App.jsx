import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Clock, Send, X } from "lucide-react";
import "./styles.css";

const VIDEOS = [
  { id: "7502551047378832671", url: "https://www.tiktok.com/@tiktok/video/7502551047378832671" },
  { id: "7532540099460893983", url: "https://www.tiktok.com/@tiktok/video/7532540099460893983" },
  { id: "7623530460693515550", url: "https://www.tiktok.com/@tiktok/video/7623530460693515550" },
  { id: "7661266332335263006", url: "https://www.tiktok.com/@tiktok/video/7661266332335263006" },
];

const INCOMING = [
  { from: "yassine.k", text: "أخويا شوف هاد الفيديو 😂" },
  { from: "nadia_", text: "فين هاد المطعم بالضبط؟" },
  { from: "omar.dz", text: "غدا خارجين؟ رد علي" },
];

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function loadTikTokScript() {
  document.querySelector('script[data-tiktok-embed="true"]')?.remove();
  const script = document.createElement("script");
  script.src = "https://www.tiktok.com/embed.js";
  script.async = true;
  script.dataset.tiktokEmbed = "true";
  document.body.appendChild(script);
}

export default function App() {
  const [index, setIndex] = useState(0);
  const [stripOpen, setStripOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sentFlash, setSentFlash] = useState(false);
  const [notification, setNotification] = useState(null);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const dragStartRef = useRef(null);
  const video = VIDEOS[index];

  useEffect(() => {
    setLoading(true);
    loadTikTokScript();
    const timer = window.setTimeout(() => setLoading(false), 1600);
    return () => window.clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    const timer = window.setInterval(() => setWatchSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!stripOpen) {
        const pick = INCOMING[Math.floor(Math.random() * INCOMING.length)];
        setNotification(pick);
        window.setTimeout(() => setNotification((current) => (current === pick ? null : current)), 6000);
      }
    }, 9000);
    return () => window.clearInterval(timer);
  }, [stripOpen]);

  const onPillPointerDown = (event) => {
    dragStartRef.current = event.clientY;
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPillPointerMove = (event) => {
    if (!dragging || dragStartRef.current == null) return;
    const delta = Math.max(0, event.clientY - dragStartRef.current);
    setDragY(Math.min(delta, 90));
  };

  const finishDrag = () => {
    if (dragging && dragY > 32) setStripOpen(true);
    setDragging(false);
    setDragY(0);
    dragStartRef.current = null;
  };

  const sendMessage = () => {
    if (!draft.trim()) return;
    setDraft("");
    setSentFlash(true);
    setNotification(null);
    window.setTimeout(() => {
      setSentFlash(false);
      setStripOpen(false);
    }, 900);
  };

  const triggerTestMessage = () => {
    const pick = INCOMING[Math.floor(Math.random() * INCOMING.length)];
    setNotification(pick);
    window.setTimeout(() => setNotification((current) => (current === pick ? null : current)), 6000);
  };

  const changeVideo = (direction) => setIndex((current) => (current + direction + VIDEOS.length) % VIDEOS.length);

  return (
    <main className="page" dir="rtl">
      <section className="experience">
        <header className="intro">
          <span className="eyebrow">TIKTOK / INTERACTION LAB</span>
          <h1>نفس الآلية، فوق فيديوهات تيك توك حقيقية</h1>
          <p>تجربة أولية لشريط الرد والإشعارات فوق محتوى عام من حساب <strong>@tiktok</strong>.</p>
        </header>

        <div className="phone" aria-label="تجربة فيديو TikTok">
          <div className="notch" />
          <div className="video-layer">
            {loading && <span className="loading">كيتحمّل الفيديو من تيك توك…</span>}
            <blockquote className="tiktok-embed" cite={video.url} data-video-id={video.id} key={video.id}>
              <section />
            </blockquote>
          </div>

          <div className="watch-timer"><Clock size={13} /><span>{formatTime(watchSeconds)}</span></div>
          <button className="round-control previous" onClick={() => changeVideo(-1)} aria-label="الفيديو السابق"><ChevronUp size={17} /></button>
          <button className="round-control next" onClick={() => changeVideo(1)} aria-label="الفيديو التالي"><ChevronDown size={17} /></button>

          {notification && !stripOpen && (
            <button
              className="notification-pill"
              onPointerDown={onPillPointerDown}
              onPointerMove={onPillPointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              onClick={() => { if (dragY < 10) setStripOpen(true); }}
              style={{ transform: `translateY(${dragY}px)`, transition: dragging ? "none" : "transform 220ms ease-out" }}
              aria-label={`فتح رسالة من ${notification.from}`}
            >
              <span className="avatar">{notification.from[0].toUpperCase()}</span>
              <span className="notification-copy"><strong>{notification.from}</strong><small>{notification.text}</small></span>
              <ChevronDown size={16} />
            </button>
          )}

          <div className={`reply-strip ${stripOpen ? "open" : ""} ${sentFlash ? "sent" : ""}`}>
            {sentFlash ? <p className="sent-message">تم الإرسال ✓</p> : <>
              <button className="close-button" onClick={() => setStripOpen(false)} aria-label="إغلاق"><X size={17} /></button>
              <input autoFocus={stripOpen} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder="اكتب و سيّب..." aria-label="نص الرسالة" />
              <button className="send-button" onClick={sendMessage} aria-label="إرسال"><Send size={14} /></button>
            </>}
          </div>
        </div>

        <button className="test-button" onClick={triggerTestMessage} disabled={Boolean(notification) || stripOpen}>+ طيّح رسالة دابا</button>
        <p className="footnote">الفيديوهات محمّلة مباشرة من TikTok عبر الـ embed الرسمي. الرسائل في هذه النسخة تجريبية ومحلية فقط.</p>
      </section>
    </main>
  );
}
