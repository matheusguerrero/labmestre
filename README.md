# Site do Lab MESTRE UFU

<https://labmestreufu.com.br>

Site em [Jekyll](https://jekyllrb.com), gerado automaticamente pelo GitHub Pages a cada alteração na branch `main`.

**Quer escrever no blog?** Veja [COMO-PUBLICAR.md](COMO-PUBLICAR.md).

## Estrutura

```
index.html            ← página inicial (seções comentadas: SOBRE, PROJETOS, EQUIPE…)
blog/index.html       ← lista de textos do blog
_posts/               ← textos publicados (AAAA-MM-DD-titulo.md)
_drafts/              ← rascunhos (não aparecem no site)
_data/autores.yml     ← autores do blog (nome, papel, foto)
_layouts/             ← modelos: default (página) e post (texto do blog)
_includes/            ← cabeçalho, rodapé e peças reaproveitadas
assets/css/style.css  ← cores e fontes do Manual da Marca v1.2 (variáveis no topo)
assets/js/main.js     ← menu, filtro de publicações e a série animada do topo
assets/fonts/         ← Montserrat, Source Sans 3 e JetBrains Mono (WOFF2, licença OFL)
assets/img/           ← logos, fotos da equipe e imagens do blog (assets/img/blog/)
```

## Como editar a página inicial

- **Novo estudante:** copie um `<li class="person">` na seção EQUIPE e troque as iniciais, o nome e o projeto.
  Para incluir minibio, acrescente um `<p class="person-bio">`.
- **Foto de membro:** JPG quadrado de 400 px em `assets/img/`, no lugar do `<div class="avatar">`:
  `<img class="avatar" src="{{ '/assets/img/arquivo.jpg' | relative_url }}" alt="Foto de …">`.
- **Nova publicação:** copie um `<li class="pub">` em PUBLICAÇÕES. O atributo `data-cat` define o filtro:
  `extremos`, `series`, `saude` ou `educacao`.
- **Novo projeto:** copie um `<article class="project">` em PROJETOS.

## Ver no próprio computador

Requer Ruby (`brew install ruby`). Na pasta do site:

```bash
bundle install
```

```bash
bundle exec jekyll serve --drafts
```

Depois abra http://localhost:4000. Com Ruby 3.2 ou mais novo, o Jekyll 3.9 do GitHub Pages precisa de
uma correção de compatibilidade (`Object#tainted?`), que fica fora do repositório.
