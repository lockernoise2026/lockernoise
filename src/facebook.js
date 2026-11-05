// Parse only known Facebook video URL shapes, and rebuild each one into a
// single canonical URL. Do not embed arbitrary user-provided URLs into
// iframe/src attributes: the value stored on a post always comes from here.
// Accepted shapes: facebook.com/watch?v=<id>, any facebook.com page/profile
// /videos/<id> link, facebook.com/reel/<id>, facebook.com/share/v|/r/<code>
// share links, and fb.watch/<code> short links. Other Facebook links
// (photos, groups, profiles, posts) are not videos and never attach.
const VIDEO_ID = /^[0-9]{5,}$/;
const SHARE_CODE = /^[A-Za-z0-9_-]{4,}$/;

function canonical(candidate) {
  let u;
  try { u = new URL(candidate.replace(/[),.!?]+$/, '')); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase().replace(/^(www\.|m\.|web\.)/, '');
  if (host === 'fb.watch') {
    const code = u.pathname.split('/').filter(Boolean)[0] || '';
    return SHARE_CODE.test(code) ? `https://fb.watch/${code}` : null;
  }
  if (host !== 'facebook.com') return null;
  const seg = u.pathname.split('/').filter(Boolean);
  const v = u.searchParams.get('v') || '';
  if (u.pathname === '/watch' && VIDEO_ID.test(v)) return `https://www.facebook.com/watch?v=${v}`;
  const vi = seg.indexOf('videos');
  if (vi >= 0 && VIDEO_ID.test(seg[vi + 1] || '')) return `https://www.facebook.com/watch?v=${seg[vi + 1]}`;
  if (seg[0] === 'reel' && VIDEO_ID.test(seg[1] || '')) return `https://www.facebook.com/reel/${seg[1]}`;
  if (seg[0] === 'share' && (seg[1] === 'v' || seg[1] === 'r') && SHARE_CODE.test(seg[2] || '')) return `https://www.facebook.com/share/${seg[1]}/${seg[2]}`;
  return null;
}

export function facebookVideoUrl(text = '') {
  const urls = String(text).match(/https?:\/\/[^\s<>"']+/gi) || [];
  for (const candidate of urls) {
    const url = canonical(candidate);
    if (url) return url;
  }
  return null;
}

/**
 * Detect a pasted Facebook video link and turn it into an attachment, the
 * same way extractYouTubeAttachment handles YouTube: keep unrelated text so
 * the member can edit their caption without breaking the video. On a
 * link-free change, the caller retains any existing attachment.
 */
export function extractFacebookAttachment(text = '') {
  const value = String(text);
  const urls = /https?:\/\/[^\s<>"']+/gi;
  let match;
  while ((match = urls.exec(value))) {
    const url = canonical(match[0]);
    if (!url) continue;
    const before = value.slice(0, match.index);
    const after = value.slice(match.index + match[0].length);
    // Preserve line breaks and original prose; only erase the link and at
    // most one redundant space left by removing it between words.
    const removeSpace = /\s$/.test(before) && /^\s/.test(after);
    return { videoUrl: url, caption: (before + (removeSpace ? after.replace(/^([ \t])/, '') : after)).trim() };
  }
  return { videoUrl: null, caption: value };
}
