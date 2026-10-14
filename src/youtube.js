// Parse only known YouTube URL shapes, and allow only an 11-character video ID.
// Do not embed arbitrary user-provided URLs into iframe/src attributes.
export function youtubeId(text = '') {
  const urls = String(text).match(/https?:\/\/[^\s<>"']+/gi) || [];
  for (const candidate of urls) {
    let u;
    try { u = new URL(candidate.replace(/[),.!?]+$/, '')); } catch { continue; }
    const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    let id = '';
    if (host === 'youtu.be') id = u.pathname.split('/')[1] || '';
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v') || '';
      else if (/^\/(?:shorts|live|embed)\//.test(u.pathname)) id = u.pathname.split('/')[2] || '';
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
  }
  return null;
}

/**
 * Detect a pasted YouTube link and turn it into an attachment. Keep unrelated
 * text so the member can edit their caption without breaking the video.
 * On a link-free change, the caller retains any existing attachment.
 */
export function extractYouTubeAttachment(text = '') {
  const value = String(text);
  const urls = /https?:\/\/[^\s<>"']+/gi;
  let match;
  while ((match = urls.exec(value))) {
    const id = youtubeId(match[0]);
    if (!id) continue;
    const before = value.slice(0, match.index);
    const after = value.slice(match.index + match[0].length);
    // Preserve line breaks and original prose; only erase the link and at
    // most one redundant space left by removing it between words.
    const removeSpace = /\s$/.test(before) && /^\s/.test(after);
    return { videoId: id, caption: (before + (removeSpace ? after.replace(/^([ \t])/, '') : after)).trim() };
  }
  return { videoId: null, caption: value };
}
