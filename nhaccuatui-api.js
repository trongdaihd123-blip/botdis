const axios = require('axios');

// Port tu /root/bot/bot2/src/Tdai-service/api-crawl/music/nhaccuatui.js
// Bo het phu thuoc Zalo, chi giu lai search API thuan.

async function searchSongs(keyword, limit = 10) {
  try {
    const encodedKeyword = encodeURIComponent(keyword.trim());
    const finalLimit = Math.max(1, parseInt(limit) || 10);
    const perPage = Math.min(finalLimit, 30);
    let allSongs = [];
    let pageIndex = 1;
    let hasMore = true;
    const maxPages = 10;

    while (allSongs.length < finalLimit && hasMore && pageIndex <= maxPages) {
      const timestamp = Date.now();
      const url = `https://graph.nhaccuatui.com/api/v1/search/song?keyword=${encodedKeyword}&pageindex=${pageIndex}&pagesize=${perPage}&correct=false&timestamp=${timestamp}`;

      const { data: res } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: 'https://www.nhaccuatui.com/',
          Origin: 'https://www.nhaccuatui.com',
          Accept: 'application/json',
        },
        timeout: 12000,
      });

      if (!res.success || !Array.isArray(res.data?.songs) || res.data.songs.length === 0) {
        hasMore = false;
      } else {
        allSongs = allSongs.concat(res.data.songs);
        pageIndex++;
      }
    }

    if (allSongs.length > finalLimit) allSongs = allSongs.slice(0, finalLimit);

    return allSongs.map((song) => {
      const isOfficial = (song.provider?.name || '').toLowerCase().includes('official');
      const isHD = song.qualityDownload?.some((q) => q.value >= 320) ?? false;
      const stream320 = song.streamURL?.find((s) => s.type === '320' && !s.onlyVIP);
      const stream128 = song.streamURL?.find((s) => s.type === '128' && !s.onlyVIP);
      const streamUrl = stream320?.stream || stream128?.stream || '';
      return {
        id: song.key,
        songLink: song.linkShare || `https://www.nhaccuatui.com/bai-hat/${song.key}.html`,
        title: song.name || 'Unknown',
        artistsNames:
          song.artist?.map((a) => a.name).join(', ') || song.artistName || 'Unknown Artist',
        thumbnail: (song.image || song.bgImage || '').replace(/150x150/, '600x600'),
        streamingStatus: isOfficial ? 1 : 2,
        isOfficial,
        isHD,
        streamUrl,
        duration: song.duration,
        dateRelease: song.dateRelease,
      };
    });
  } catch (err) {
    console.error('[NCT] search error:', err.message);
    return [];
  }
}

function formatDuration(sec) {
  if (!sec) return '?:??';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

module.exports = { searchSongs, formatDuration };
