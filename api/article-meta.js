const fs = require('fs');
const path = require('path');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wvfcifqolohfipvepxss.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_ZFDHQDhZfHmKeH7elEOv7g_UV83GXR7';

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function rich(text){
  let t = esc(text||'');
  t = t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  t = t.replace(/\*([^*]+)\*/g,'<em>$1</em>');
  return t.split(/\n\s*\n/).filter(b=>b.trim()).map(b=>{
    const lines=b.split('\n');
    if(lines.every(l=>/^\s*[-*]\s+/.test(l))) return '<ul>'+lines.map(l=>'<li>'+l.replace(/^\s*[-*]\s+/,'')+'</li>').join('')+'</ul>';
    if(lines.every(l=>/^\s*\d+[.)]\s+/.test(l))) return '<ol>'+lines.map(l=>'<li>'+l.replace(/^\s*\d+[.)]\s+/,'')+'</li>').join('')+'</ol>';
    return '<p>'+lines.join('<br>')+'</p>';
  }).join('');
}
function validSlug(s){ return typeof s==='string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s.length<=100; }
function safeImg(u){
  u=String(u||'').trim();
  if(!u) return '';
  try { const x=new URL(u, 'https://www.mwcnupondokaren.or.id'); if(x.protocol==='https:') return x.href; } catch(e){}
  return '';
}

module.exports = async (req,res) => {
  if(req.method !== 'GET'){ res.status(405).setHeader('Content-Type','text/plain; charset=utf-8').send('Method Not Allowed'); return; }
  const slug = String((req.query && req.query.slug) || '').trim();
  if(!validSlug(slug)){ res.status(400).setHeader('Content-Type','text/plain; charset=utf-8').send('Bad Request'); return; }

  let data;
  try {
    const url = `${SUPABASE_URL}/rest/v1/content_items?select=id,type,data,published&data->>slug=eq.${encodeURIComponent(slug)}&type=eq.berita&published=eq.true&limit=1`;
    const r = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    if(!r.ok) throw new Error('query failed');
    const arr = await r.json();
    data = Array.isArray(arr) && arr.length ? arr[0] : null;
  } catch(e){
    res.status(500).setHeader('Content-Type','text/plain; charset=utf-8').send('Internal Server Error');
    return;
  }
  if(!data){ res.status(404).setHeader('Content-Type','text/plain; charset=utf-8').send('Not Found'); return; }

  const d = data.data || {};
  const title = d.meta_judul || d.judul || 'Berita MWCNU Pondok Aren';
  const desc = d.meta_desc || d.ringkasan || d.lead || '';
  const img = safeImg(d.foto) || 'https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/hero/2026/mwkj0e742sr6.webp';
  const date = d.tanggal || d.created_at || '';
  const body = d.isi || d.body || '';
  const canonical = `https://www.mwcnupondokaren.or.id/berita/${slug}`;

  let shell = '';
  try { shell = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8'); } catch (e) { shell = ''; }

  const arBody = `<div id="arBody" data-server-rendered="true">
  <div class="article-head"><h1 class="at">${esc(d.judul||title)}</h1></div>
  <div class="article-content"><div class="abody">${rich(body)}</div></div>
</div>`;

  let html = shell ? shell.replace('</main>', arBody + '</main>') : `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${esc(title)} | MWCNU Pondok Aren</title></head><body>${arBody}</body></html>`;
  html = html.replace(/<title>.*?<\/title>/, `<title>${esc(title)} | MWCNU Pondok Aren</title>`);
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${esc(desc)}">`);
  html = html.replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${esc(canonical)}">`);
  if (!/window\.__ARTICLE_SLUG__/.test(html)) {
    html = html.replace('</body>', `<script>window.__ARTICLE_SLUG__=${JSON.stringify(slug)};</script></body>`);
  } else {
    html = html.replace(/<script>window\.__ARTICLE_SLUG__=.*?<\/script>/, `<script>window.__ARTICLE_SLUG__=${JSON.stringify(slug)};</script>`);
  }

  res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600').send(html);
};
