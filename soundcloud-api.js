const axios = require('axios');

const API_URL = 'https://api-v2.soundcloud.com';
const HOMEPAGE = 'https://soundcloud.com/';

const KNOWN_IDS = [
  'mQqpsaUSNZxyik7mV9y4D6dunaNX3mrQ',
  'EsIST4DWFy7hEa8mvPoVwdj4ZNTZqmei',
  'W00nmY7TLer3uyoEo1sWK3Hhke5Ahdl9',
];

const UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36',
];

let clientId = null;

function randUA() {
  return UAS[Math.floor(Math.random() * UAS.length)];
}

function headers() {
  return {
    'User-Agent': randUA(),
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://soundcloud.com/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  };
}

async function refreshClientId() {
  for (const id of KNOWN_IDS) {
    try {
      const test = await axios.get(`${API_URL}/search/tracks`, {
        params: { q: 'test', client_id: id, limit: 1, offset: 0, app_locale: 'en' },
        headers: { 'User-Agent': randUA(), Referer: HOMEPAGE },
        timeout: 10000,
      });
      if (test.status === 200) {
        clientId = id;
        return;
      }
    } catch {}
  }

  try {
    const res = await axios.get(HOMEPAGE, { headers: headers(), timeout: 15000 });
    const scripts = res.data.match(/<script[^>]+src="(https:[^"]+)"[^>]*>/g);
    if (scripts) {
      for (const s of [...scripts].reverse()) {
        const src = s.match(/src="([^"]+)"/)?.[1];
        if (!src) continue;
        try {
          const js = await axios.get(src, { headers: { 'User-Agent': randUA() }, timeout: 10000 });
          const m = js.data.match(/client_id:"([^"]+)"/);
          if (m && m[1]) {
            clientId = m[1];
            return;
          }
        } catch {}
      }
    }
  } catch {}

  clientId = KNOWN_IDS[0];
}

async function getClientId() {
  if (clientId) return clientId;
  await refreshClientId();
  return clientId;
}

async function searchTracks(query, limit = 10) {
  const id = await getClientId();
  const res = await axios.get(`${API_URL}/search/tracks`, {
    params: { q: query, client_id: id, limit, offset: 0, app_locale: 'en' },
    headers: headers(),
    timeout: 15000,
  });
  return res.data?.collection || [];
}

async function getStreamUrl(permalinkUrl) {
  const id = await getClientId();
  const resolve = await axios.get(`${API_URL}/resolve`, {
    params: { url: permalinkUrl, client_id: id },
    headers: headers(),
    timeout: 15000,
  });
  const data = resolve.data;
  const prog = data?.media?.transcodings?.find(t => t.format.protocol === 'progressive');
  if (!prog) return null;
  const stream = await axios.get(`${prog.url}?client_id=${id}&track_authorization=${data.track_authorization}`, {
    headers: headers(),
    timeout: 15000,
  });
  return stream.data?.url || null;
}

function getHeaders() {
  return headers();
}

async function streamTrack(permalinkUrl) {
  const mp3Url = await getStreamUrl(permalinkUrl);
  if (!mp3Url) throw new Error('Không tìm thấy stream audio');
  const res = await axios.get(mp3Url, {
    headers: headers(),
    responseType: 'stream',
    timeout: 30000,
    maxRedirects: 5,
  });
  return res.data;
}

async function downloadTrack(permalinkUrl, outputPath) {
  const mp3Url = await getStreamUrl(permalinkUrl);
  if (!mp3Url) throw new Error('Không tìm thấy stream audio');
  const res = await axios.get(mp3Url, {
    headers: headers(),
    responseType: 'stream',
    timeout: 120000,
    maxRedirects: 5,
  });
  const writer = require('fs').createWriteStream(outputPath);
  res.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function extractTrackInfo(track) {
  return {
    id: track.id,
    title: track.title,
    username: track.user?.username || 'Unknown',
    permalinkUrl: track.permalink_url,
    artworkUrl: track.artwork_url?.replace('-large', '-t500x500') || null,
    playbackCount: track.playback_count,
    likesCount: track.likes_count,
    commentCount: track.comment_count,
    genre: track.genre,
    duration: track.duration ? formatDuration(track.duration) : null,
  };
}

module.exports = {
  searchTracks,
  getStreamUrl,
  streamTrack,
  downloadTrack,
  formatDuration,
  extractTrackInfo,
  refreshClientId,
  getHeaders,
};
