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
  d.slug = d.slug || slug;
  const title = d.meta_judul || d.judul || 'Berita MWCNU Pondok Aren';
  const desc = d.meta_desc || d.ringkasan || d.lead || '';
  const img = safeImg(d.foto);
  const date = d.tanggal || d.created_at || '';
  const body = d.isi || d.body || '';
  const canonical = `https://www.mwcnupondokaren.or.id/berita/${slug}`;
  const arBody = `<article id="arBody" class="ar" data-server-rendered="true">
  <div class="article-head"><div class="crumb"><a href="#berita">&larr; Kabar dan Berita</a></div><div class="kick">${esc(d.kategori||'Berita')}</div><h1 class="at">${esc(d.judul||title)}</h1><div class="article-byline"><span>${esc(d.penulis||'Redaksi MWCNU Pondok Aren')}</span><i aria-hidden="true">·</i><span>${esc(date)}</span></div></div>
  ${img?`<figure class="af"><img class="ah" src="${esc(img)}" alt="${esc(d.judul||title)}">${d.caption?`<figcaption>${esc(d.caption)}</figcaption>`:''}</figure>`:''}
  <div class="article-content"><div class="abody">${rich(body)}</div></div>
  <div class="ashare" aria-label="Bagikan artikel"><b class="ashare-title">Bagikan Artikel</b><a class="share-btn share-wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`${title} ${canonical}`)}"><span>WhatsApp</span></a></div>
</article>`;
  const articleSection = `<section id="baca" class="vw"><div class="wrap"><div class="ar-grid no-side">${arBody}</div></div></section>`;

  let html = '';
  try { html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8'); } catch (e) { html = ''; }
  html = html ? html.replace(/<section id="baca"[\s\S]*?<\/section>/, articleSection) : `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${esc(title)} | MWCNU Pondok Aren</title></head><body><main>${articleSection}</main></body></html>`;
  html = html.replace(/<title>.*?<\/title>/, `<title>${esc(title)} | MWCNU Pondok Aren</title>`);
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${esc(desc)}">`);
  html = html.replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${esc(canonical)}">`);
  if (html.includes('<meta property="og:image:secure_url"')) html = html.replace(/<meta property="og:image:secure_url" content=".*?">/, img ? `<meta property="og:image:secure_url" content="${esc(img)}">` : '');
  html = html.replace(/<meta property="og:type" content=".*?">/, '<meta property="og:type" content="article">');
  html = html.replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${esc(title)}">`);
  html = html.replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${esc(desc)}">`);
  html = html.replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${esc(canonical)}">`);
  html = html.replace(/<meta name="twitter:title" content=".*?">/, `<meta name="twitter:title" content="${esc(title)}">`);
  html = html.replace(/<meta name="twitter:description" content=".*?">/, `<meta name="twitter:description" content="${esc(desc)}">`);
  html = html.replace(/<meta name="twitter:card" content=".*?">/, `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`);
  if (!img) html = html.replace(/<meta property="og:image:(?:width|height|alt)" content=".*?">\s*/g, '');
  if (img) {
    html = html.replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${esc(img)}">`);
    html = html.replace(/<meta name="twitter:image" content=".*?">/, `<meta name="twitter:image" content="${esc(img)}">`);
    html = html.replace(/<meta property="og:image:alt" content=".*?">/, `<meta property="og:image:alt" content="${esc(title)}">`);
  } else {
    html = html.replace(/<meta property="og:image" content=".*?">\s*/,'');
    html = html.replace(/<meta name="twitter:image" content=".*?">\s*/,'');
    html = html.replace(/<meta property="og:image:(?:width|height|alt)" content=".*?">\s*/g,'');
  }
  if (!/window\.__ARTICLE_SLUG__/.test(html)) {
    html = html.replace('</body>', `<script>window.__ARTICLE_SLUG__=${JSON.stringify(slug)};</script></body>`);
  } else {
    html = html.replace(/<script>window\.__ARTICLE_SLUG__=.*?<\/script>/, `<script>window.__ARTICLE_SLUG__=${JSON.stringify(slug)};</script>`);
  }

  res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600').send(html);
};
