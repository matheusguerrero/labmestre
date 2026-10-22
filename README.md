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
_data/inovacao.yml    ← propostas e projetos da página Inovação (status, edital, equipe)
_data/eventos.yml     ← eventos e trabalhos apresentados (página Eventos e faixa na inicial)
inovacao/, servicos/  ← páginas Inovação e Serviços (assessoria para editais)
eventos/              ← página Eventos; fotos e PDFs em assets/eventos/<pasta-do-evento>/
_layouts/             ← modelos: default (página) e post (texto do blog)
_includes/            ← cabeçalho, rodapé e peças reaproveitadas
assets/css/style.css  ← cores e fontes do Manual da Marca v1.2 (variáveis no topo)
assets/js/main.js     ← menu, filtro de publicações e a série animada do topo
assets/fonts/         ← Montserrat, Source Sans 3 e JetBrains Mono (WOFF2, licença OFL)
assets/img/           ← logos, fotos da equipe e imagens do blog (assets/img/blog/)
```

## Como editar a página inicial

- **Novo estudante:** copie um `<li class="person">` na seção EQUIPE e troque as iniciais, o nome e o projeto.
  Nome e papel ficam dentro de `<div class="person-head">`; para incluir minibio, acrescente um `<p class="person-bio">` depois dele.
- **Foto de membro:** JPG quadrado de 400 px em `assets/img/`, no lugar do `<div class="avatar">`:
  `<img class="avatar" src="{{ '/assets/img/arquivo.jpg' | relative_url }}" alt="Foto de …">`.
- **Nova publicação:** copie um `<li class="pub">` em PUBLICAÇÕES. O atributo `data-cat` define o filtro:
  `extremos`, `series`, `saude` ou `educacao`.
- **Novo projeto:** copie um `<article class="project">` em PROJETOS.
- **Nova proposta em edital:** acrescente um item em `_data/inovacao.yml`. A contagem e os filtros da
  página Inovação se atualizam sozinhos; o total em R$ (`resumo.valor`) é editado à mão.

- **Novo evento:** crie a pasta `assets/eventos/AAAA-nome/` com as fotos (JPG, até 1000 px) e os PDFs, e
  acrescente o evento no topo de `_data/eventos.yml`. A página inicial mostra sempre o primeiro da lista.

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
