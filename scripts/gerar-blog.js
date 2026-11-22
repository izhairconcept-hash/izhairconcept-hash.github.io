import fs from 'fs';

const API_KEY = process.env.GEMINI_API_KEY;
const PAUTAS_PATH = './blog/pautas.json';
const TEMPLATE_PATH = './blog/template-post.html';
const DOMAIN = 'https://izhairconcept.com.br';
const MODELO_ESTAVEL = 'gemini-3.6-flash';

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
          console.log(`Gerado com sucesso usando ${MODELO_ESTAVEL} (tentativa ${tentativa}).`); return JSON.parse(data.candidates[0].content.parts[0].text); } ultimoErro = 'Resposta sem conteúdo válido.'; } else { ultimoErro = `HTTP ${response.status}: ${await response.text()}`; } } catch (erroRede) { ultimoErro = erroRede.message; }  console.warn(`[Tentativa ${tentativa}/4] Falha temporária (${ultimoErro.slice(0, 120)})...`);

    if (tentativa < 4) {
      console.log('Aguardando 15 segundos antes de tentar novamente...');
      await esperar(15000);
    }
  }

  throw new Error(`Falha após 4 tentativas no modelo ${MODELO_ESTAVEL}: ${ultimoErro}`); }  async function gerarNovaPautaInedita(pautasExistentes) { const historicoTitulos = pautasExistentes .map(p => `- ${p.titulo || p.tema}`)
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

    .topbar a
