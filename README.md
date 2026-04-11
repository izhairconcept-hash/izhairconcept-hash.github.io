# IZ Hair Concept — Site Oficial

Site estático otimizado para SEO, pronto para hospedagem no GitHub Pages.

---

## 📁 Estrutura de arquivos

```
izhairconcept/
├── index.html          ← Site completo (HTML + CSS + JS num único arquivo)
├── robots.txt          ← Permite indexação pelo Google
├── sitemap.xml         ← Mapa do site para o Google
├── .nojekyll           ← Necessário para o GitHub Pages servir corretamente
├── images/             ← Pasta para suas fotos (veja instruções abaixo)
│   ├── izabella.jpg    ← Foto principal (seção Sobre)
│   ├── galeria-1.jpg   ← Fotos da galeria
│   ├── galeria-2.jpg
│   ├── galeria-3.jpg
│   ├── galeria-4.jpg
│   ├── galeria-5.jpg
│   └── og-image.jpg    ← Foto para compartilhamento (WhatsApp, redes)
└── README.md
```

---

## 🚀 Como publicar no GitHub Pages (passo a passo)

### 1. Crie um repositório no GitHub
- Acesse [github.com](https://github.com) e faça login
- Clique em **"New repository"**
- Nome sugerido: `izhairconcept` (ou `izhairconcept.github.io` para URL mais limpa)
- Deixe **Public** marcado
- Clique em **"Create repository"**

### 2. Faça upload dos arquivos
**Opção A — Pelo site do GitHub (mais fácil):**
- No repositório criado, clique em **"uploading an existing file"**
- Arraste todos os arquivos desta pasta
- Clique em **"Commit changes"**

**Opção B — Via Git (linha de comando):**
```bash
git init
git add .
git commit -m "Primeiro commit - IZ Hair Concept"
git remote add origin https://github.com/SEU_USUARIO/izhairconcept.git
git push -u origin main
```

### 3. Ative o GitHub Pages
- No repositório, vá em **Settings → Pages**
- Em "Source", selecione **"Deploy from a branch"**
- Branch: **main** / Folder: **/ (root)**
- Clique em **Save**
- Aguarde 1-2 minutos — seu site estará em:
  `https://SEU_USUARIO.github.io/izhairconcept/`

---

## 🔗 Configurar domínio próprio (izhairconcept.com.br)

### No GitHub Pages:
- Em **Settings → Pages → Custom domain**
- Digite: `izhairconcept.com.br`
- Marque **"Enforce HTTPS"**

### No seu provedor de domínio (Registro.br, Locaweb, etc.):
Adicione estes registros DNS:

**Registro A (4 entradas):**
```
Tipo: A    Nome: @    Valor: 185.199.108.153
Tipo: A    Nome: @    Valor: 185.199.109.153
Tipo: A    Nome: @    Valor: 185.199.110.153
Tipo: A    Nome: @    Valor: 185.199.111.153
```

**Registro CNAME:**
```
Tipo: CNAME    Nome: www    Valor: SEU_USUARIO.github.io
```

A propagação pode levar até 24-48h.

---

## 📸 Como adicionar suas fotos

No `index.html`, os comentários indicam onde inserir cada imagem. Exemplo:

**Foto da Izabella (seção Sobre):**
```html
<!-- Substitua pelo: -->
<img src="images/izabella.jpg" alt="Izabella Miranda, cabeleireira e tricologista em BH" />
```

**Fotos da galeria:**
```html
<img src="images/galeria-1.jpg" alt="Coloração loiro platinado - IZ Hair Concept BH" />
```

### Dicas para as fotos:
- Tamanho recomendado: máximo 200KB por foto (use [squoosh.app](https://squoosh.app) para comprimir)
- Formato: `.jpg` ou `.webp`
- `og-image.jpg`: 1200×630px (foto para compartilhamento no WhatsApp)
- Galeria: proporção quadrada (1:1) ou retrato (3:4)

---

## ✏️ O que personalizar antes de publicar

Abra o `index.html` e substitua:

| O que | Por quê | Onde buscar |
|---|---|---|
| `5531999999999` | Seu número real do WhatsApp | Seu celular |
| `Seg – Sex: 9h às 19h` | Seus horários reais | — |
| Os depoimentos | Avaliações reais de clientes | Google / Instagram |
| As fotos da galeria | Suas fotos reais | Seu celular / Instagram |
| A foto da Izabella | Foto profissional sua | — |

---

## 🔍 SEO — O que já está configurado

- ✅ Title otimizado com palavra-chave local
- ✅ Meta description com CTA
- ✅ Schema markup `BeautySalon` (dados estruturados)
- ✅ Open Graph para redes sociais e WhatsApp
- ✅ `robots.txt` permitindo indexação
- ✅ `sitemap.xml`
- ✅ Tags semânticas HTML5 (`<main>`, `<section>`, `<article>`, `<nav>`, etc.)
- ✅ Alt text em todas as imagens
- ✅ Links internos entre seções
- ✅ HTTPS via GitHub Pages

## 📊 Próximos passos após publicar

1. Cadastrar o site no **Google Search Console** (search.google.com/search-console)
2. Submeter o `sitemap.xml` no Search Console
3. Completar o **Google Meu Negócio** com link do site
4. Atualizar o link na bio do Instagram para o domínio próprio
