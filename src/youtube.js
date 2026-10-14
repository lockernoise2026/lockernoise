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
