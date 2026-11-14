// =====================================================================
//  /api/videos — função da Vercel que busca os vídeos e shorts mais
//  recentes do canal direto das páginas públicas do YouTube (sem chave).
//  O site usa isso para se atualizar sozinho; se der erro, o site
//  continua mostrando a lista fixa do script.js.
// =====================================================================
const HANDLE = '@MT-TOP-GAMER.2006';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function initialData(html) {
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  return m ? JSON.parse(m[1]) : null;
}

function walk(obj, key, out) {
  if (!obj || typeof obj !== 'object') return out;
  if (Array.isArray(obj)) { for (const v of obj) walk(v, key, out); return out; }
  for (const k of Object.keys(obj)) {
    if (k === key) out.push(obj[k]);
    else walk(obj[k], key, out);
  }
  return out;
}

const textOf = (t) => (t && (t.content || t.simpleText || (t.runs || []).map((r) => r.text).join(''))) || '';

function parseVideos(data) {
  const list = [];
  for (const v of walk(data, 'lockupViewModel', [])) {
    const id = v.contentId;
    const meta = v.metadata && v.metadata.lockupMetadataViewModel;
    if (!id || !meta) continue;
    const parts = walk(meta, 'metadataParts', []).flat().map((p) => textOf(p.text)).filter(Boolean);
    const badge = walk(v.contentImage, 'thumbnailBadgeViewModel', [])[0];
    list.push({
      id,
      titulo: textOf(meta.title),
      duracao: badge ? badge.text : '',
      views: parts.find((p) => /visualiza/i.test(p)) || '',
      quando: parts.find((p) => /^h[áa] /i.test(p)) || '',
    });
  }
  // formato antigo da página, por garantia
  for (const v of walk(data, 'videoRenderer', [])) {
    if (!v.videoId || list.some((x) => x.id === v.videoId)) continue;
    list.push({ id: v.videoId, titulo: textOf(v.title), duracao: textOf(v.lengthText), views: textOf(v.viewCountText), quando: textOf(v.publishedTimeText) });
  }
  return list;
}

function parseShorts(data) {
  const list = [];
  for (const s of walk(data, 'shortsLockupViewModel', [])) {
    const ep = walk(s.onTap, 'reelWatchEndpoint', [])[0];
    const id = ep && ep.videoId;
    if (!id) continue;
    const om = s.overlayMetadata || {};
    list.push({ id, titulo: textOf(om.primaryText), views: textOf(om.secondaryText) });
  }
  return list;
}

async function page(path) {
  const r = await fetch(`https://www.youtube.com/${HANDLE}/${path}`, { headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9' } });
  if (!r.ok) throw new Error(`YouTube respondeu ${r.status}`);
  return initialData(await r.text());
}

async function handler(req, res) {
  try {
    const [v, s] = await Promise.all([page('videos'), page('shorts')]);
    const videos = v ? parseVideos(v) : [];
    const shorts = s ? parseShorts(s) : [];
    if (!videos.length && !shorts.length) throw new Error('nenhum vídeo encontrado');
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify({ atualizado: new Date().toISOString(), videos, shorts }));
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=60');
    res.status(502).json({ erro: String(e.message || e) });
  }
}

module.exports = handler;
module.exports.parseVideos = parseVideos;
module.exports.parseShorts = parseShorts;
module.exports.initialData = initialData;
