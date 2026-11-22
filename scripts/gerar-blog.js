function atualizarIndiceESitemap(pautas) {
  const publicados = pautas
    .filter(p => p.status === 'publicado')
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  const cardsHtml = publicados.map(post => `
    <article class="post-card">
      <time datetime="${post.data}">${formatarDataBR(post.data)}</time>
      <h2><a href="/blog/${post.slug}.html">${post.titulo}</a></h2>
      <p>${post.resumo || ''}</p>
      <a href="/blog/${post.slug}.html" class="ler-mais">Ler guia completo →</a>
    </article>
  `).join('\n');

  const indexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog de Beleza e Cuidados | Iz Hair Concept - Funcionários, BH</title>
  <meta name="description" content="Dicas de cabelo, unhas e cuidados capilares preparadas pelos especialistas do Iz Hair Concept no bairro Funcionários, Belo Horizonte.">
  <link rel="canonical" href="${DOMAIN}/blog/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">

  <!-- Google Tag / GA4 + Google Ads -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZLC9N89TR8"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-ZLC9N89TR8');
    gtag('config', 'AW-18556249023');
  </script>

  <style>
    :root {
      --bg-dark: #16120e;
      --bg-card: #1f1a14;
      --gold: #c9a050;
      --gold-light: #e0be75;
      --text-main: #f3ede4;
      --text-muted: #b8aea0;
      --border: rgba(201, 160, 80, 0.25);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: 'Montserrat', sans-serif;
      line-height: 1.7;
      font-weight: 300;
    }

    .topbar {
      border-bottom: 1px solid var(--border);
      padding: 1.5rem 5%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .brand {
      text-decoration: none;
      color: var(--gold);
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.8rem;
      letter-spacing: 0.15em;
      font-weight: 600;
      line-height: 1;
    }

    .brand span {
      display: block;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.6rem;
      letter-spacing: 0.28em;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .topbar a.voltar {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.8rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      transition: color 0.3s;
    }

    .topbar a.voltar:hover { color: var(--gold); }

    .hero-blog {
      text-align: center;
      padding: 3.5rem 1.5rem 2.5rem;
      max-width: 760px;
      margin: 0 auto;
    }

    .hero-blog h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(2.3rem, 5vw, 3.2rem);
      color: var(--gold);
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .hero-blog p {
      color: var(--text-muted);
      font-size: 1rem;
    }

    .lista-posts {
      max-width: 960px;
      margin: 1rem auto 4rem;
      padding: 0 1.5rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 1.75rem;
    }

    .post-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.25s, border-color 0.25s;
    }

    .post-card:hover {
      transform: translateY(-4px);
      border-color: var(--gold);
    }

    .post-card time {
      color: var(--gold);
      font-size: 0.75rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 0.6rem;
      display: block;
    }

    .post-card h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.55rem;
      line-height: 1.25;
      margin-bottom: 0.85rem;
      font-weight: 600;
    }

    .post-card h2 a {
      color: var(--text-main);
      text-decoration: none;
      transition: color 0.3s;
    }

    .post-card h2 a:hover { color: var(--gold-light); }

    .post-card p {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 1.4rem;
    }

    .ler-mais {
      color: var(--gold);
      text-decoration: none;
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .ler-mais:hover { color: var(--gold-light); }

    footer {
      border-top: 1px solid var(--border);
      text-align: center;
      padding: 2rem 1rem;
      color: var(--text-muted);
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="topbar">
    <a href="/" class="brand">IZ<span>HAIR CONCEPT • BY IZABELLA MIRANDA</span></a>
    <a href="/" class="voltar">← Voltar para o site</a>
  </div>

  <header class="hero-blog">
    <h1>Blog Iz Hair Concept</h1>
    <p>Guias práticos de beleza, cuidados capilares e bem-estar no bairro Funcionários, Belo Horizonte.</p>
  </header>

  <main class="lista-posts">
    ${cardsHtml || '<p>Em breve novos artigos.</p>'}
  </main>

  <footer>
    <p>Iz Hair Concept — Rua Piauí, 1285, Funcionários, Belo Horizonte - MG</p>
  </footer>
</body>
</html>`;

  fs.writeFileSync('./blog/index.html', indexHtml, 'utf-8');
  console.log('blog/index.html atualizado.');

  const dataHoje = new Date().toISOString().split('T')[0];

  const paginasFixas = [
    { loc: `${DOMAIN}/`, lastmod: dataHoje, priority: '1.0' },
    { loc: `${DOMAIN}/wifi/`, lastmod: dataHoje, priority: '0.5' },
    { loc: `${DOMAIN}/blog/`, lastmod: dataHoje, priority: '0.8' }
  ];

  const urlsArtigos = publicados.map(post => ({
    loc: `${DOMAIN}/blog/${post.slug}.html`,
    lastmod: post.data,
    priority: '0.7'
  }));

  const todasUrls = [...paginasFixas, ...urlsArtigos];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${todasUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync('./sitemap.xml', sitemapXml, 'utf-8');
  console.log(`sitemap.xml atualizado com ${todasUrls.length} URLs.`);
}
