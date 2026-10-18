# Site do Lab MESTRE UFU

Site estático (HTML + CSS + JavaScript puro), sem etapa de build. Basta abrir ou hospedar a pasta `site/`.

## Estrutura

```
site/
├── index.html            ← todo o conteúdo (seções comentadas: SOBRE, PROJETOS, EQUIPE…)
└── assets/
    ├── css/style.css     ← cores e fontes do Manual da Marca v1.2 (variáveis no topo)
    ├── js/main.js        ← menu, filtro de publicações e a série animada do topo
    ├── fonts/            ← Montserrat, Source Sans 3 e JetBrains Mono (WOFF2, licença OFL)
    └── img/              ← assinaturas, barra UFU + IME e favicons (da pasta de identidade visual)
```

## Como editar

- **Novo estudante:** copie um `<li class="person">` na seção EQUIPE e troque as iniciais, o nome e o projeto.
- **Nova publicação:** copie um `<li class="pub">` em PUBLICAÇÕES. O atributo `data-cat` define o filtro:
  `extremos`, `series`, `saude` ou `educacao`.
- **Novo projeto:** copie um `<article class="project">` em PROJETOS.
- **Links do coordenador:** há um comentário na seção EQUIPE indicando onde incluir Lattes, Google Scholar e LinkedIn.

## Ver localmente

```bash
python3 -m http.server 8765 --directory site
```

Depois abra http://localhost:8765.

## Publicar (gratuito)

- **GitHub Pages:** crie um repositório, envie o conteúdo de `site/` e ative *Settings → Pages*.
- **Netlify ou Cloudflare Pages:** arraste a pasta `site/` no painel.
- **Servidor da UFU:** copie a pasta `site/` para o diretório público indicado pelo CTIC.
