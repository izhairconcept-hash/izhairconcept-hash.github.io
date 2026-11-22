import fs from 'fs';

const API_KEY = process.env.GEMINI_API_KEY;
const PAUTAS_PATH = './blog/pautas.json';
const TEMPLATE_PATH = './blog/template-post.html';
const DOMAIN = 'https://izhairconcept.com.br';
const MODELO_ESTAVEL = 'gemini-3.6-flash-lite';

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatarDataBR(dataIso) {
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function montarFaqSchema(faqs) {
  if (!Array.isArray(faqs) || faqs.length === 0) return '';
  return JSON.stringify({
    "@type": "FAQPage",
    "mainEntity": faqs.map(item => ({
      "@type": "Question",
      "name": item.pergunta,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.resposta
      }
    }))
  });
}

async function chamarGemini(prompt) {
  let ultimoErro = '';

  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_ESTAVEL}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          console.log(`Gerado com sucesso usando ${MODELO_ESTAVEL} (tentativa ${tentativa}).`);
          return JSON.parse(data.candidates[0].content.parts[0].text);
        }
        ultimoErro = 'Resposta sem conteúdo válido.';
      } else {
        ultimoErro = `HTTP ${response.status}: ${await response.text()}`;
      }
    } catch (erroRede) {
      ultimoErro = erroRede.message;
    }

    console.warn(`[Tentativa ${tentativa}/4] Falha temporária (${ultimoErro.slice(0, 120)})...`);

    if (tentativa < 4) {
      console.log('Aguardando 15 segundos antes de tentar novamente...');
      await esperar(15000);
    }
  }

  throw new Error(`Falha após 4 tentativas no modelo ${MODELO_ESTAVEL}: ${ultimoErro}`);
}

async function gerarNovaPautaInedita(pautasExistentes) {
  const historicoTitulos = pautasExistentes
    .map(p => `- ${p.titulo || p.tema}`)
    .join('\n');

  const proximoId = pautasExistentes.length > 0
    ? Math.max(...pautasExistentes.map(p => p.id || 0)) + 1
    : 1;

  const promptPauta = `
Você é o estrategista de SEO local do salão "Iz Hair Concept", localizado na Rua Piauí, 1285, bairro Funcionários, Belo Horizonte - MG (próximo à Savassi).
Todos os temas planejados anteriormente já foram publicados. Crie UMA nova pauta inédita de alta intenção de busca local.

Serviços permitidos: cuidados capilares, coloração, mechas, loiros, morena iluminada, hidratação, nutrição, reconstrução, progressiva sem formol, corte, escova, manicure, pedicure, esmaltação em gel, blindagem, alongamento de unhas e spa dos pés.
PROIBIDO: Nunca gere temas sobre Dia da Noiva, penteados de noiva, maquiagem ou design de sobrancelhas.

Artigos JÁ PUBLICADOS (NÃO repita estes temas nem variações muito parecidas):
${historicoTitulos || 'Nenhum artigo publicado ainda.'}

Responda EXCLUSIVAMENTE com um JSON válido neste formato:
{
  "tema": "Título descritivo da nova pauta conectando o serviço à rotina ou clima de BH/Funcionários/Savassi",
  "keyword": "palavra-chave local principal com 3 a 5 palavras sem acentos (ex: hidratacao profunda savassi bh)"
}
`;

  const novaIdeia = await chamarGemini(promptPauta);

  return {
    id: proximoId,
    status: 'pendente',
    tema: novaIdeia.tema,
    keyword: novaIdeia.keyword
  };
}

async function gerarArtigo(pauta) {
  const promptArtigo = `
Você é a redatora especialista em beleza do salão "Iz Hair Concept", localizado na Rua Piauí, 1285, bairro Funcionários, Belo Horizonte - MG (próximo à Savassi).
Escreva um artigo técnico, prático e acolhedor sobre: "${pauta.tema}".
Palavra-chave foco: "${pauta.keyword}".

Regras obrigatórias para SEO Local e GEO (citação por IAs):
1. Mencione naturalmente o contexto de Belo Horizonte (clima, rotina da região Centro-Sul/Funcionários/Savassi) sem parecer robótico.
2. Crie um "resumo_direto" de 2 a 3 frases respondendo objetivamente à dúvida principal do tema (ideal para Featured Snippets e IAs).
3. Estruture o "conteudo_html" usando apenas tags <h2>, <h3>, <p>, <ul>, <li> e <strong>.
4. Inclua 3 perguntas e respostas reais no array "faqs" para gerar Schema FAQPage.
5. Nunca invente promoções ou preços não informados.

Responda EXCLUSIVAMENTE com um JSON válido neste formato:
{
  "titulo": "Título atraente com até 65 caracteres",
  "slug": "url-amigavel-sem-acentos",
  "meta_description": "Descrição de até 155 caracteres com chamada para BH",
  "resumo_direto": "Resposta direta e objetiva em 40-60 palavras",
  "conteudo_html": "<h2>...</h2><p>...</p>",
  "faqs": [
    { "pergunta": "...", "resposta": "..." }
  ]
}
`;

  return await chamarGemini(promptArtigo);
}

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

  <!-- Google Tag / GA4 + Google Ads -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZLC9N89TR8"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-ZLC9N89TR8');
    gtag('config', 'AW-18556249023');
  </script>
</head>
<body>
  <header>
    <nav><a href="/">← Voltar para o site Iz Hair Concept</a></nav>
    <h1>Blog Iz Hair Concept</h1>
    <p>Guias práticos de beleza, cuidados capilares e bem-estar em Belo Horizonte.</p>
  </header>

  <main class="lista-posts">
    ${cardsHtml || '<p>Em breve novos artigos.</p>'}
  </main>
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

async function main() {
  try {
    if (!API_KEY) {
      throw new Error('A variável de ambiente GEMINI_API_KEY não está definida.');
    }

    if (!fs.existsSync(PAUTAS_PATH) || !fs.existsSync(TEMPLATE_PATH)) {
      throw new Error('Arquivos blog/pautas.json ou blog/template-post.html não encontrados.');
    }

    const pautas = JSON.parse(fs.readFileSync(PAUTAS_PATH, 'utf-8'));
    let proxima = pautas.find(p => p.status === 'pendente');

    if (!proxima) {
      console.log('Fila inicial concluída. Gerando nova pauta inédita via Gemini...');
      proxima = await gerarNovaPautaInedita(pautas);
      pautas.push(proxima);
      console.log(`Nova pauta criada (#${proxima.id}): "${proxima.tema}"`);
    }

    console.log(`Gerando artigo para pauta #${proxima.id}: "${proxima.tema}"...`);
    const artigo = await gerarArtigo(proxima);
    const slugFinal = sanitizarSlug(artigo.slug || proxima.keyword);
    const dataIso = new Date().toISOString().split('T')[0];

    let html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    const faqSchema = montarFaqSchema(artigo.faqs);

    html = html
      .replaceAll('{{TITULO}}', artigo.titulo)
      .replaceAll('{{META_DESCRIPTION}}', artigo.meta_description)
      .replaceAll('{{SLUG}}', slugFinal)
      .replaceAll('{{DATA_ISO}}', dataIso)
      .replaceAll('{{RESUMO_DIRETO}}', artigo.resumo_direto)
      .replaceAll('{{CONTEUDO_HTML}}', artigo.conteudo_html)
      .replaceAll('{{SCHEMA_FAQ}}', faqSchema);

    const caminhoArtigo = `./blog/${slugFinal}.html`;
    fs.writeFileSync(caminhoArtigo, html, 'utf-8');
    console.log(`Artigo salvo em: ${caminhoArtigo}`);

    proxima.status = 'publicado';
    proxima.slug = slugFinal;
    proxima.titulo = artigo.titulo;
    proxima.resumo = artigo.resumo_direto;
    proxima.data = dataIso;
    fs.writeFileSync(PAUTAS_PATH, JSON.stringify(pautas, null, 2), 'utf-8');

    atualizarIndiceESitemap(pautas);
    console.log('Processo concluído com sucesso!');
  } catch (erro) {
    console.error('Falha na execução do gerador:', erro.message);
    process.exit(1);
  }
}

main();
