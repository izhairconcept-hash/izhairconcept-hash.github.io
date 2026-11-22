import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
const PAUTAS_PATH = './blog/pautas.json';
const TEMPLATE_PATH = './blog/template-post.html';

async function gerarArtigo(pauta) {
  const prompt = `
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    }
  );

  const data = await response.json();
  const textoJson = data.candidates[0].content.parts[0].text;
  return JSON.parse(textoJson);
}

function montarFaqSchema(faqs) {
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

async function main() {
  const pautas = JSON.parse(fs.readFileSync(PAUTAS_PATH, 'utf-8'));
  const proxima = pautas.find(p => p.status === 'pendente');

  if (!proxima) {
    console.log('Nenhuma pauta pendente.');
    return;
  }

  console.log(`Gerando: ${proxima.tema}...`);
  const artigo = await gerarArtigo(proxima);
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  const dataIso = new Date().toISOString().split('T')[0];

  html = html
    .replaceAll('{{TITULO}}', artigo.titulo)
    .replaceAll('{{META_DESCRIPTION}}', artigo.meta_description)
    .replaceAll('{{SLUG}}', artigo.slug)
    .replaceAll('{{DATA_ISO}}', dataIso)
    .replaceAll('{{RESUMO_DIRETO}}', artigo.resumo_direto)
    .replaceAll('{{CONTEUDO_HTML}}', artigo.conteudo_html)
    .replaceAll('{{SCHEMA_FAQ}}', montarFaqSchema(artigo.faqs));

  fs.writeFileSync(`./blog/${artigo.slug}.html`, html, 'utf-8');

  proxima.status = 'publicado';
  proxima.slug = artigo.slug;
  proxima.titulo = artigo.titulo;
  proxima.data = dataIso;
  fs.writeFileSync(PAUTAS_PATH, JSON.stringify(pautas, null, 2), 'utf-8');

  console.log(`Publicado em /blog/${artigo.slug}.html`);
}

main();
