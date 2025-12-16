import React, { useEffect, useMemo, useRef, useState } from "react";
import NavigationMenuButton from "../dashboard/NavigationMenuButton";

export default function PodcastAudioMobile() {
  const API_BASE = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/+$/, ""); // expects .../api
  const PAGE_SIZE = 30;

  // ---------- State ----------
  const [tab, setTab] = useState("library"); // library | playlists | now
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [tracksError, setTracksError] = useState("");

  const [playlists, setPlaylists] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlistsError, setPlaylistsError] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [loadingPlaylistItems, setLoadingPlaylistItems] = useState(false);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const [seeking, setSeeking] = useState(false);
  const [seekPreview, setSeekPreview] = useState(0);

  const [playbackRate, setPlaybackRate] = useState(1.0);

  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");

  // ---------- Refs ----------
  const audioRef = useRef(null);
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef({ t: 0, ts: 0 }); // last saved position + timestamp

  const apiFetch = async (path, opts = {}) => {
    const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
    const res = await fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
      credentials: "include",
    });
    if (!res.ok) {
      const data = res.body;
      const msg = data?.error || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return res;
  };

  // local fallback: key = playback:<trackId>
  const localKey = (trackId) => `playback:${trackId}`;
  const loadLocalPos = (trackId) => {
    try {
      const raw = localStorage.getItem(localKey(trackId));
      if (!raw) return null;
      const v = JSON.parse(raw);
      if (!v || typeof v.positionSec !== "number") return null;
      return v;
    } catch {
      return null;
    }
  };
  const saveLocalPos = (trackId, positionSec, durationSec) => {
    try {
      localStorage.setItem(
        localKey(trackId),
        JSON.stringify({ positionSec, durationSec, updatedAt: Date.now() })
      );
    } catch { }
  };

  const savePositionRemote = async (trackId, positionSec, durationSec) => {
    if (!trackId) return;
    // small guard to avoid spam
    const now = Date.now();
    if (Math.abs(positionSec - lastSavedRef.current.t) < 1 && now - lastSavedRef.current.ts < 15000) return;
    lastSavedRef.current = { t: positionSec, ts: now };

    try {
      await apiFetch(`/audio/playback-position`, {
        method: "POST",
        body: JSON.stringify({ trackId, positionSec, durationSec }),
      });
    } catch {
      // ignore; local fallback already done
    }
  };

  const loadPositionRemote = async (trackId) => {
    try {
      const res = await apiFetch(`/audio/playback-position/${trackId}`, { method: "GET" });
      const data = await res.json();
      if (data && typeof data.position_sec === "number") {
        return { positionSec: data.position_sec || 0, durationSec: data.duration_sec || 0 };
      }
      return null;
    } catch {
      return null;
    }
  };

  // ---------- Data Loading ----------
  const loadTracks = async ({ reset = false } = {}) => {
    if (loadingTracks) return;
    setLoadingTracks(true);
    setTracksError("");
    try {
      const nextPage = reset ? 1 : page;
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(PAGE_SIZE),
      }).toString();

      const res = await apiFetch(`/audio/tracks?${params}`, { method: "GET" });
      const data = await res.json();

      setTracks((prev) => (reset ? data.items || [] : [...prev, ...(data.items || [])]));
    } catch (e) {
      setTracksError(e.message || "Failed to load tracks");
    } finally {
      setLoadingTracks(false);
    }
  };

  const deletePlaylist = async (playlistId, playlistName) => {
    const ok = window.confirm(`Delete playlist "${playlistName}"?\n\nThis cannot be undone.`);
    if (!ok) return;

    try {
      await apiFetch(`/audio/playlists/${playlistId}`, {
        method: "DELETE",
      });

      // Reset selection if needed
      if (selectedPlaylistId === playlistId) {
        setSelectedPlaylistId(null);
        setPlaylistItems([]);
      }

      // Refresh playlists
      loadPlaylists();
    } catch (e) {
    }
  };

  const deleteTrack = async (trackId, title) => {
    const ok = window.confirm(`Delete "${title}"?\n\nThis cannot be undone.`);
    if (!ok) return;

    try {
      await apiFetch(`/audio/tracks/${trackId}`, { method: "DELETE" });

      // Remove from local state
      setTracks((prev) => prev.filter((t) => t.id !== trackId));

      // Stop playback if this track is playing
      if (currentTrack?.id === trackId) {
        audioRef.current?.pause();
        setCurrentTrack(null);
        setAudioUrl("");
        setIsPlaying(false);
      }
    } catch (e) {

    }
  };

  const loadPlaylists = async () => {
    if (loadingPlaylists) return;
    setLoadingPlaylists(true);
    setPlaylistsError("");
    try {
      const res = await apiFetch(`/audio/playlists`, { method: "GET" });
      const data = await res.json();
      setPlaylists(data.items || []);
    } catch (e) {
      setPlaylistsError(e.message || "Failed to load playlists");
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const loadPlaylistItems = async (playlistId) => {
    setLoadingPlaylistItems(true);
    try {
      const res = await apiFetch(`/audio/playlists/${playlistId}`, { method: "GET" });
      const data = await res.json();
      setPlaylistItems(data.items || []);
    } catch {
      setPlaylistItems([]);
    } finally {
      setLoadingPlaylistItems(false);
    }
  };

  const createPlaylist = async () => {
    const name = prompt("Playlist name?");
    if (!name) return;
    try {
      await apiFetch(`/audio/playlists`, { method: "POST", body: JSON.stringify({ name }) });
      loadPlaylists();
    } catch (e) {

    }
  };

  const addToPlaylist = async (playlistId, trackId) => {
    try {
      await apiFetch(`/audio/playlists/${playlistId}/items`, {
        method: "POST",
        body: JSON.stringify({ trackId }),
      });

      if (selectedPlaylistId === playlistId) loadPlaylistItems(playlistId);
    } catch (e) {

    }
  };

  const removeFromPlaylist = async (playlistId, trackId) => {
    try {
      await apiFetch(`/audio/playlists/${playlistId}/items/${trackId}`, { method: "DELETE" });

      if (selectedPlaylistId === playlistId) loadPlaylistItems(playlistId);
    } catch (e) {

    }
  };

  // ---------- Playback ----------
  const signAndLoad = async (track) => {
    setSigning(true);
    setSignError("");
    try {
      const res = await apiFetch(`/audio/tracks/${track.id}/signed-url`, { method: "GET" });
      const data = await res.json();
      const url = data.url;
      if (!url) throw new Error("Signed URL missing");
      setAudioUrl(url);
      setCurrentTrack(track);
    } catch (e) {
      setSignError(e.message || "Failed to sign URL");
    } finally {
      setSigning(false);
    }
  };

  const playTrack = async (track) => {
    // if switching tracks: persist previous
    if (currentTrack?.id && audioRef.current) {
      saveLocalPos(currentTrack.id, audioRef.current.currentTime || 0, audioRef.current.duration || 0);
      await savePositionRemote(currentTrack.id, audioRef.current.currentTime || 0, audioRef.current.duration || 0);
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioUrl("");
    await signAndLoad(track);
  };

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    try {
      if (a.paused) {
        await a.play();
      } else {
        a.pause();
      }
    } catch {
      // autoplay restrictions etc.
    }
  };

  // Resume logic when audio loads
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    a.playbackRate = playbackRate;

    const onLoaded = async () => {
      setDuration(a.duration || 0);

      const tid = currentTrack?.id;
      if (!tid) return;

      // Prefer backend, fallback to local
      const remote = await loadPositionRemote(tid);
      const local = loadLocalPos(tid);

      const candidate = remote || local;
      let resumeAt = candidate?.positionSec || 0;

      // If near end, restart
      if (a.duration && resumeAt > a.duration - 5) resumeAt = 0;

      // Only seek if meaningful
      if (resumeAt > 1) {
        a.currentTime = resumeAt;
        setCurrentTime(resumeAt);
      }

      // attempt autoplay if user initiated playTrack (usually OK)
      try {
        await a.play();
      } catch {
        // user can tap play
      }
    };

    const onTime = () => {
      if (!seeking) setCurrentTime(a.currentTime || 0);
      setIsPlaying(!a.paused);
      setDuration(a.duration || 0);
    };

    const onPausePlay = () => setIsPlaying(!a.paused);

    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("pause", onPausePlay);
    a.addEventListener("play", onPausePlay);

    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("pause", onPausePlay);
      a.removeEventListener("play", onPausePlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, currentTrack?.id, seeking, playbackRate]);

  // Periodic save while playing
  useEffect(() => {
    if (!currentTrack?.id) return;

    const tick = async () => {
      const a = audioRef.current;
      if (!a) return;
      const pos = a.currentTime || 0;
      const dur = a.duration || 0;
      saveLocalPos(currentTrack.id, pos, dur);
      await savePositionRemote(currentTrack.id, pos, dur);
    };

    if (saveTimerRef.current) window.clearInterval(saveTimerRef.current);
    saveTimerRef.current = window.setInterval(() => {
      const a = audioRef.current;
      if (a && !a.paused && isFinite(a.currentTime)) tick();
    }, 10000);

    return () => {
      if (saveTimerRef.current) window.clearInterval(saveTimerRef.current);
    };
  }, [currentTrack?.id]);

  // Save on unload / route away
  useEffect(() => {
    const handler = () => {
      const a = audioRef.current;
      if (!a || !currentTrack?.id) return;
      saveLocalPos(currentTrack.id, a.currentTime || 0, a.duration || 0);
      // best-effort; can’t await reliably
      try {
        navigator.sendBeacon?.(
          `${API_BASE}/audio/playback-position`,
          new Blob(
            [JSON.stringify({ trackId: currentTrack.id, positionSec: a.currentTime || 0, durationSec: a.duration || 0 })],
            { type: "application/json" }
          )
        );
      } catch { }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [API_BASE, currentTrack?.id]);

  // ---------- Initial Loads ----------
  useEffect(() => {
    loadTracks({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "playlists") loadPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (!tracks.some(t => t.status === "importing")) return;
    const id = setTimeout(() => loadTracks({ reset: true }), 8000);
    return () => clearTimeout(id);
  }, [tracks]);

  // ---------- Styles ----------
  const styles = useMemo(
    () => ({
      root: {
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      },
      header: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,

        padding: "14px 16px 10px",
        paddingTop: "calc(14px + env(safe-area-inset-top))",

        background: "rgba(11,11,15,0.92)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      },
      titleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
      h1: { margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.2 },
      pillRow: { display: "flex", gap: 8, marginTop: 12 },
      pill: (active) => ({
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.06)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
      }),
      search: {
        marginTop: 12,
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#fff",
        outline: "none",
        fontSize: 14,
      },
      content: { flex: 1, overflowY: "auto", padding: "10px 12px 92px" }, // leave space for bottom bar
      grid: {
        display: "grid",
        gridTemplateColumns: "1fr", // 👈 full-width cards
        gap: 12,
      },
      card: {
        borderRadius: 16,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        overflow: "hidden",
      },
      cover: { width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" },
      cardBody: { padding: 10, display: "flex", flexDirection: "column", gap: 6 },
      tTitle: { fontSize: 14, fontWeight: 700, lineHeight: 1.15 },
      tMeta: { fontSize: 12, color: "rgba(255,255,255,0.72)" },
      btn: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontWeight: 700,
        fontSize: 13,
      },
      btnPrimary: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.16)",
        color: "#fff",
        fontWeight: 800,
        fontSize: 13,
      },
      row: { display: "flex", alignItems: "center", gap: 10 },
      muted: { color: "rgba(255,255,255,0.72)", fontSize: 13 },
      error: {
        marginTop: 10,
        padding: 10,
        borderRadius: 12,
        border: "1px solid rgba(255,90,90,0.35)",
        background: "rgba(255,90,90,0.10)",
        color: "#ffd0d0",
        fontSize: 13,
      },
      bottomNav: {
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        background: "rgba(11,11,15,0.92)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "10px 10px 12px",
      },
      navRow: { display: "flex", gap: 8, justifyContent: "space-between" },
      navBtn: (active) => ({
        flex: 1,
        padding: "10px 10px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.06)",
        color: "#fff",
        fontWeight: 800,
        fontSize: 12,
      }),
      mini: {
        position: "fixed",
        left: 10,
        right: 10,
        bottom: 70,
        zIndex: 25,

        borderRadius: 16,
        padding: 10,

        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flexWrap: "nowrap",

        background: "rgba(11,11,15,0.85)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.14)",

        overflow: "hidden",          // ⭐ critical for contained aura
      },

      miniImg: { width: 46, height: 46, borderRadius: 12, objectFit: "cover" },
      miniText: { flex: 1, minWidth: 0 },
      miniTitle: { fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
      miniMeta: { fontSize: 12, color: "rgba(255,255,255,0.72)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
      miniBtn: {
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.25)",
        color: "#fff",
        fontWeight: 900,
        fontSize: 14,
      },
      nowWrap: {
        padding: "8px 12px 72px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100vh",
      },

      nowTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 6,
        flexShrink: 0,
      },

      nowCover: {
        width: "100%",
        maxWidth: 320,
        margin: "8px auto 0",
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.05)",
        flexShrink: 0,
      },

      nowCoverImg: {
        width: "100%",
        aspectRatio: "1 / 1",
        objectFit: "cover",
        display: "block",
        maxHeight: "42vh",        // ⭐ key line
      },

      nowInfo: {
        textAlign: "center",
        padding: "8px 6px 4px",
        flexShrink: 0,
      },

      nowTitle: {
        fontSize: 17,
        fontWeight: 900,
        letterSpacing: -0.2,
        margin: 0,
        lineHeight: 1.2,
      },

      nowMeta: {
        margin: "4px 0 0",
        color: "rgba(255,255,255,0.72)",
        fontSize: 12,
        lineHeight: 1.2,
      },

      scrub: { maxWidth: 520, margin: "14px auto 0", padding: "0 6px" },
      range: { width: "100%" },
      timeRow: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.72)" },
      controls: { display: "flex", justifyContent: "center", gap: 10, marginTop: 14, flexWrap: "wrap" },
      ctl: {
        padding: "12px 14px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontWeight: 900,
        fontSize: 14,
        minWidth: 78,
      },
      bigCtl: {
        padding: "12px 18px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.20)",
        background: "rgba(255,255,255,0.18)",
        color: "#fff",
        fontWeight: 900,
        fontSize: 15,
        minWidth: 120,
      },
      speedRow: { display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" },
      speedBtn: (active) => ({
        padding: "10px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.06)",
        color: "#fff",
        fontWeight: 900,
        fontSize: 13,
      }),
      divider: { height: 1, background: "rgba(255,255,255,0.10)", margin: "12px 0" },
      list: { display: "flex", flexDirection: "column", gap: 10 },
      listItem: {
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
        padding: 10,
        display: "flex",
        gap: 10,
        alignItems: "center",
      },
      liImg: { width: 56, height: 56, borderRadius: 14, objectFit: "cover" },
      liText: { flex: 1, minWidth: 0 },
      liTitle: { fontSize: 14, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
      liMeta: { fontSize: 12, color: "rgba(255,255,255,0.72)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    }),
    [currentTrack]
  );

  // ---------- UI Parts ----------
  const Library = () => {
    const [showUploadModal, setShowUploadModal] = React.useState(false);
    const [importUrl, setImportUrl] = React.useState("");
    const [uploading, setUploading] = React.useState(false);
    const [uploadError, setUploadError] = React.useState("");
    const [addModalTrack, setAddModalTrack] = React.useState(null);

    // ♾️ Infinite scroll state
    const [hasMore, setHasMore] = React.useState(true);
    const loadingMoreRef = React.useRef(false);

    const sentinelRef = React.useRef(null);
    const observerRef = React.useRef(null);

    const swipeRef = React.useRef({
      startX: 0,
      startY: 0,
      swiping: false,
    });

    const SWIPE_ACTION_DISTANCE = 90;
    const SWIPE_VERTICAL_TOLERANCE = 40;

    // Spinner keyframes
    React.useEffect(() => {
      const style = document.createElement("style");
      style.innerHTML = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
    }, []);

    // Infinite scroll observer
    React.useEffect(() => {
      if (!sentinelRef.current) return;

      observerRef.current?.disconnect();

      if (!hasMore) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting &&
            !loadingTracks &&
            !loadingMoreRef.current &&
            hasMore
          ) {
            loadingMoreRef.current = true;

            loadTracks({ reset: false }).finally(() => {
              loadingMoreRef.current = false;
            });
          }
        },
        { rootMargin: "200px" }
      );

      observerRef.current.observe(sentinelRef.current);

      return () => observerRef.current?.disconnect();
    }, [hasMore, loadingTracks]);

    // LOAD TRACKS (authoritative hasMore logic)
    async function loadTracks({ reset }) {
      if (reset) {
        setHasMore(true);
      }

      try {
        const res = await apiFetch("/audio/list", {
          method: "POST",
          body: JSON.stringify({
            page: reset ? 1 : page,
          }),
        });

        setTracks((prev) => {
          const next = reset ? res.items : [...prev, ...res.items];

          // 🛑 HARD STOP — no more data
          if (
            res.items.length === 0 ||
            next.length >= res.total
          ) {
            setHasMore(false);
          }

          return next;
        });

      } catch (e) {
        setHasMore(false);
      }
    }

    const submitImport = async () => {
      if (!importUrl.trim()) return;

      setUploading(true);
      setUploadError("");

      try {
        await apiFetch("/audio/import", {
          method: "POST",
          body: JSON.stringify({ url: importUrl.trim() }),
        });

        setShowUploadModal(false);
        setImportUrl("");

        setTimeout(() => {
          setHasMore(true);
          loadTracks({ reset: true });
        }, 800);
      } catch (e) {
        setUploadError(e.message || "Failed to import");
      } finally {
        setUploading(false);
      }
    };

    return (
      <>
        {/* ---------- HEADER ---------- */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            {/* LEFT */}
            <NavigationMenuButton />

            {/* TITLE */}
            <h1 style={styles.h1}>Library</h1>

            {/* RIGHT ACTIONS */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={styles.btnPrimary}
                onClick={() => setShowUploadModal(true)}
              >
                Upload
              </button>

              <button
                style={styles.btn}
                onClick={() => window.location.reload()}
              >
                Refresh
              </button>
            </div>
          </div>

          {tracksError && <div style={styles.error}>{tracksError}</div>}
        </div>



        {/* ---------- CONTENT ---------- */}
        <div style={styles.content}>
          {tracks.length === 0 && !loadingTracks && (
            <div style={{ padding: 12, ...styles.muted }}>
              No tracks yet.
            </div>
          )}

          <div style={styles.list}>
            {tracks.map((t) => (
              <div
                key={t.id}
                style={styles.listItem}
                onClick={() => t.status !== "importing" && playTrack(t)}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  swipeRef.current = {
                    startX: touch.clientX,
                    startY: touch.clientY,
                    swiping: true,
                  };
                }}
                onTouchMove={(e) => {
                  if (!swipeRef.current.swiping) return;

                  const touch = e.touches[0];
                  const dx = touch.clientX - swipeRef.current.startX;
                  const dy = Math.abs(touch.clientY - swipeRef.current.startY);

                  if (dy > SWIPE_VERTICAL_TOLERANCE) {
                    swipeRef.current.swiping = false;
                    return;
                  }

                  if (dx < 0) {
                    e.currentTarget.style.transform = `translateX(${Math.max(dx, -120)}px)`;
                    e.currentTarget.style.background = "rgba(255,90,90,0.15)";
                  }

                  if (dx > 0) {
                    e.currentTarget.style.transform = `translateX(${Math.min(dx, 120)}px)`;
                    e.currentTarget.style.background = "rgba(120,200,255,0.15)";
                  }
                }}

                onTouchEnd={(e) => {
                  const dx =
                    e.changedTouches[0].clientX -
                    swipeRef.current.startX;

                  swipeRef.current.swiping = false;
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";

                  if (t.status === "importing") return;

                  if (dx < -SWIPE_ACTION_DISTANCE) {
                    deleteTrack(t.id, t.title || "Untitled");
                  } else if (dx > SWIPE_ACTION_DISTANCE) {
                    setAddModalTrack(t);
                  }
                }}
              >
                {/* ICON */}
                <div style={styles.icon}>
                  🎧
                  {t.status === "importing" && (
                    <div style={styles.spinnerOverlay}>
                      <div style={styles.spinner} />
                    </div>
                  )}
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.tTitle}>
                    {t.title || "Untitled"}
                  </div>

                  <div style={styles.tMeta}>
                    {t.status === "importing"
                      ? "Importing…"
                      : [t.artist, t.album].filter(Boolean).join(" • ") ||
                      (t.isAudiobook ? "Audiobook" : "Podcast")}
                  </div>

                  {t.status === "failed" && (
                    <div style={{ ...styles.error, marginTop: 6 }}>
                      Import failed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ♾️ Sentinel */}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

          {loadingTracks && (
            <div style={{ padding: 12, ...styles.muted, textAlign: "center" }}>
              Loading…
            </div>
          )}
        </div>


        {/* ---------- ADD TO PLAYLIST MODAL ---------- */}
        {addModalTrack && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "grid",
              placeItems: "center",
              zIndex: 120,
            }}
            onClick={() => setAddModalTrack(null)}
          >
            <div
              style={{
                width: "90%",
                maxWidth: 420,
                background: "#0b0b0f",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.12)",
                padding: 16,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Add to Playlist</h2>

              {playlists.map((p) => (
                <button
                  key={p.id}
                  style={{ ...styles.btn, width: "100%", marginBottom: 8 }}
                  onClick={() => {
                    addToPlaylist(p.id, addModalTrack.id);
                    setAddModalTrack(null);
                  }}
                >
                  {p.name}
                </button>
              ))}

              <button
                style={{ ...styles.btn, marginTop: 10 }}
                onClick={() => setAddModalTrack(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ---------- UPLOAD MODAL ---------- */}
        {showUploadModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "grid",
              placeItems: "center",
              zIndex: 100,
            }}
            onClick={() => !uploading && setShowUploadModal(false)}
          >
            <div
              style={{
                width: "90%",
                maxWidth: 420,
                background: "#0b0b0f",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.12)",
                padding: 16,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Import a Track</h2>

              <input
                style={styles.search}
                placeholder="https://..."
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                disabled={uploading}
              />

              {uploadError && (
                <div style={{ ...styles.error, marginTop: 10 }}>
                  {uploadError}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
                <button
                  style={styles.btn}
                  disabled={uploading}
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>

                <button
                  style={styles.btnPrimary}
                  disabled={uploading || !importUrl.trim()}
                  onClick={submitImport}
                >
                  {uploading ? "Importing…" : "Import"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };




  const Playlists = () => {
    const pendingTrackId = sessionStorage.getItem("pendingAddTrackId");
    const pendingTrackTitle = sessionStorage.getItem("pendingAddTrackTitle");

    const swipeRef = React.useRef({
      startX: 0,
      startY: 0,
      swiping: false,
    });

    const SWIPE_DELETE_THRESHOLD = 90;
    const SWIPE_VERTICAL_TOLERANCE = 40;

    return (
      <>
        {/* ---------- HEADER ---------- */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h1 style={styles.h1}>Playlists</h1>
            <button style={styles.btnPrimary} onClick={createPlaylist}>
              New
            </button>
          </div>

          {playlistsError && <div style={styles.error}>{playlistsError}</div>}

          {pendingTrackId && (
            <div
              style={{
                ...styles.error,
                borderColor: "rgba(120,200,255,0.35)",
                background: "rgba(120,200,255,0.10)",
                color: "#d7efff",
              }}
            >
              Adding: <b>{pendingTrackTitle || pendingTrackId}</b>
              <div style={{ marginTop: 8, ...styles.muted }}>
                Tap a playlist to add.
              </div>
            </div>
          )}
        </div>

        {/* ---------- CONTENT ---------- */}
        <div style={styles.content}>
          {loadingPlaylists && (
            <div style={{ padding: 12, ...styles.muted }}>Loading…</div>
          )}

          {/* ---------- PLAYLIST LIST ---------- */}
          <div style={styles.list}>
            {playlists.map((p) => (
              <div
                key={p.id}
                style={{
                  ...styles.listItem,
                  cursor: "pointer",
                  touchAction: "pan-y",
                  transition: "transform 0.15s ease-out",
                }}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  swipeRef.current = {
                    startX: t.clientX,
                    startY: t.clientY,
                    swiping: true,
                  };
                }}
                onTouchMove={(e) => {
                  if (!swipeRef.current.swiping) return;

                  const t = e.touches[0];
                  const dx = t.clientX - swipeRef.current.startX;
                  const dy = Math.abs(t.clientY - swipeRef.current.startY);

                  if (dy > SWIPE_VERTICAL_TOLERANCE) {
                    swipeRef.current.swiping = false;
                    return;
                  }

                  if (dx < 0) {
                    e.currentTarget.style.transform = `translateX(${Math.max(dx, -120)}px)`;
                    e.currentTarget.style.background = "rgba(255,90,90,0.15)";
                  }
                }}
                onTouchEnd={(e) => {
                  const { startX } = swipeRef.current;
                  swipeRef.current.swiping = false;

                  const t = e.changedTouches[0];
                  const dx = t.clientX - startX;

                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";

                  if (dx < -SWIPE_DELETE_THRESHOLD) {
                    deletePlaylist(p.id, p.name);
                    return;
                  }

                  if (pendingTrackId) {
                    addToPlaylist(p.id, pendingTrackId).then(() => {
                      sessionStorage.removeItem("pendingAddTrackId");
                      sessionStorage.removeItem("pendingAddTrackTitle");
                    });
                  } else {
                    setSelectedPlaylistId(p.id);
                    loadPlaylistItems(p.id);
                  }
                }}
              >
                {/* ICON */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.06)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  ♫
                </div>

                <div style={styles.liText}>
                  <div style={styles.liTitle}>{p.name}</div>
                  <div style={styles.liMeta}>
                    {Number(p.itemCount || 0)} items
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ---------- PLAYLIST ITEMS ---------- */}
          {selectedPlaylistId && (
            <>
              <div style={styles.divider} />

              <div
                style={{
                  ...styles.row,
                  justifyContent: "space-between",
                  padding: "0 4px",
                }}
              >
                <div style={{ fontWeight: 900 }}>Playlist Items</div>
                <button
                  style={styles.btn}
                  onClick={() => setSelectedPlaylistId(null)}
                >
                  Back
                </button>
              </div>

              {loadingPlaylistItems && (
                <div style={{ padding: 12, ...styles.muted }}>Loading…</div>
              )}

              <div style={{ ...styles.list, marginTop: 10 }}>
                {playlistItems.map((t) => (
                  <div key={t.id} style={styles.listItem}>
                    {/* ICON */}
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.06)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                      onClick={() =>
                        playTrack({
                          id: t.id,
                          title: t.title,
                          artist: t.artist,
                          album: t.album,
                          isAudiobook: t.is_audiobook,
                        })
                      }
                    >
                      🎧
                    </div>

                    <div
                      style={styles.liText}
                      onClick={() =>
                        playTrack({
                          id: t.id,
                          title: t.title,
                          artist: t.artist,
                          album: t.album,
                          isAudiobook: t.is_audiobook,
                        })
                      }
                    >
                      <div style={styles.liTitle}>
                        {t.title || "Untitled"}
                      </div>
                      <div style={styles.liMeta}>
                        {[t.artist, t.album].filter(Boolean).join(" • ")}
                      </div>
                    </div>

                    <button
                      style={styles.btn}
                      onClick={() =>
                        removeFromPlaylist(selectedPlaylistId, t.id)
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {playlistItems.length === 0 && !loadingPlaylistItems && (
                  <div style={{ padding: 12, ...styles.muted }}>
                    No items in this playlist yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </>
    );
  };


  // ---------- Render ----------
  return (
    <div style={styles.root}>
      {/* hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="meta  // Mini player progress
  const miniPct = duration ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
data"
        playsInline
        onEnded={() => {
          setIsPlaying(false);
          // save end position as 0 so next time restarts (or keep end; your choice)
          if (currentTrack?.id) {
            saveLocalPos(currentTrack.id, 0, duration || 0);
            savePositionRemote(currentTrack.id, 0, duration || 0);
          }
        }}
      />

      {/* Mini Player */}
      {currentTrack && tab !== "now" && (
        <div
          style={{
            ...styles.mini,
            opacity: signing ? 0.75 : 1,
          }}
          onClick={() => {
            if (!signing) {
              setNowOpen(true);
              setTab("now");
            }
          }}
        >
          {/* AURA LAYER (contained) */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: "-30%",
              background: `
          linear-gradient(
            120deg,
            rgba(168,85,247,0.45),
            rgba(56,189,248,0.45),
            rgba(236,72,153,0.45),
            rgba(99,102,241,0.45)
          )
        `,
              backgroundSize: "300% 300%",
              filter: "blur(28px)",
              animation: isPlaying
                ? "auraShift 12s ease-in-out infinite, auraPulse 4.5s ease-in-out infinite"
                : "auraPulse 6s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />

          {/* CONTENT LAYER */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              width: "100%",
            }}
          >
            {/* LEFT: ICON */}
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: "rgba(255,255,255,0.08)",
                display: "grid",
                placeItems: "center",
                fontSize: 20,
                fontWeight: 900,
                flexShrink: 0,
                position: "relative",
              }}
            >
              🎧

              {signing && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(0,0,0,0.35)",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: "3px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.9s linear infinite",
                    }}
                  />
                </div>
              )}
            </div>

            {/* MIDDLE: TITLE + SCRUB */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  ...styles.miniTitle,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentTrack.title || "Untitled"}
              </div>

              <input
                type="range"
                min={0}
                max={Math.max(1, duration || 1)}
                step={0.25}
                value={Math.min(currentTime, duration || 1)}
                disabled={!duration || signing}
                onMouseDown={() => setSeeking(true)}
                onTouchStart={() => setSeeking(true)}
                onChange={(e) => setSeekPreview(Number(e.target.value))}
                onMouseUp={() => {
                  const a = audioRef.current;
                  if (a) a.currentTime = seekPreview;
                  setSeeking(false);
                  setCurrentTime(seekPreview);
                }}
                onTouchEnd={() => {
                  const a = audioRef.current;
                  if (a) a.currentTime = seekPreview;
                  setSeeking(false);
                  setCurrentTime(seekPreview);
                }}
                style={{
                  width: "100%",
                  marginTop: 6,
                  accentColor: "#fff",
                  opacity: duration ? 1 : 0.4,
                }}
              />
            </div>

            {/* RIGHT: PLAY / PAUSE */}
            <button
              style={{
                ...styles.miniBtn,
                flexShrink: 0,
                opacity: signing ? 0.6 : 1,
              }}
              disabled={signing}
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>
          </div>
        </div>
      )}


      {/* Main Screens */}
      {tab === "library" ? <Library /> : null}
      {tab === "playlists" ? <Playlists /> : null}

      {/* Bottom Nav */}
      <div style={styles.bottomNav}>
        <div style={styles.navRow}>
          <button style={styles.navBtn(tab === "library")} onClick={() => setTab("library")}>
            Library
          </button>
          <button style={styles.navBtn(tab === "playlists")} onClick={() => setTab("playlists")}>
            Playlists
          </button>
        </div>
      </div>
    </div>
  );
}
