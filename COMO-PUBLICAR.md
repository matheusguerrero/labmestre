# Como publicar no blog do Lab MESTRE

Qualquer membro do laboratório pode escrever no blog. Há dois caminhos.

## Caminho 1: mandar o texto por e-mail

Escreva no Word ou no Google Docs e envie para matheusguerrero@ufu.br com:

- título;
- um resumo de uma ou duas frases;
- imagens em arquivos separados (PNG ou JPG), se houver.

O texto é revisado e publicado por quem cuida do site.

## Caminho 2: publicar direto pelo GitHub

Não é preciso instalar nada. Você só precisa de uma conta no GitHub e ser adicionado ao repositório
(o coordenador faz isso em *Settings → Collaborators → Add people*).

1. Abra <https://github.com/matheusguerrero/labmestre>.
2. Clique em **Add file → Create new file**.
3. No campo do nome, escreva `_posts/` seguido da data e de um título curto, sem acentos e com hífens:

   ```
   _posts/2026-11-03-valores-extremos-em-criptoativos.md
   ```

   A data no nome é a data de publicação que aparece no site.
4. Cole o modelo abaixo e escreva o texto embaixo das linhas `---`.
5. Clique em **Commit changes…**, escolha **Create a new branch for this commit and start a pull request**
   e confirme.
6. O coordenador revisa e aprova (*Merge*). Cerca de um minuto depois, o texto está no ar.

### Modelo

```markdown
---
title: "Título do texto"
autor: samara
categoria: Pesquisa
resumo: "Uma ou duas frases que aparecem na lista de textos."
math: false
---

Primeiro parágrafo do texto.

## Um subtítulo

Mais texto.
```

- **autor**: a sua chave no arquivo [`_data/autores.yml`](_data/autores.yml) (ex.: `matheus`, `icaro`, `quintiliano`,
  `leandro`, `samara`, `paolo`, `gabriel`, `matheus-neves`, `ana`, `isabella`, `renata`, `vitor`).
  Membro novo? Acrescente uma entrada nesse arquivo.
- **categoria**: livre. Sugestões: *Pesquisa*, *Métodos*, *Eventos*, *Notícias do laboratório*, *Outros assuntos*.
- **math**: use `true` se o texto tiver fórmulas.

## Formatação (Markdown)

| Para ter…                | escreva…                                  |
|--------------------------|-------------------------------------------|
| subtítulo                | `## Subtítulo` (ou `###` para um nível abaixo) |
| *itálico*                | `*itálico*`                               |
| **negrito**              | `**negrito**`                             |
| link                     | `[texto do link](https://endereco.com)`   |
| lista                    | linhas começando com `- `                 |
| lista numerada           | linhas começando com `1. `, `2. `…        |
| citação                  | linha começando com `> `                  |
| código no meio da frase  | `` `summary(modelo)` ``                   |

**Bloco de código** (indique a linguagem para colorir):

````markdown
```r
modelo <- glm(y ~ x, family = poisson)
summary(modelo)
```
````

**Fórmulas** (com `math: true`): use `$$` dos dois lados, tanto no meio da frase quanto em linha própria.

```markdown
O limiar $$u$$ é escolhido pelo gráfico da vida residual média.

$$
\hat{\xi} = \frac{1}{k} \sum_{i=1}^{k} \log \frac{X_{(i)}}{X_{(k+1)}}
$$
```

**Imagens**: envie o arquivo para a pasta `assets/img/blog/` (*Add file → Upload files*) e use

```markdown
![Descrição da imagem para quem não enxerga](/assets/img/blog/nome-do-arquivo.png)
*Legenda opcional em itálico, logo abaixo da imagem.*
```

Prefira imagens com no máximo 1600 px de largura.

## Rascunhos

Textos na pasta `_drafts/` (sem data no nome do arquivo) ficam guardados, mas não aparecem no site.
Para publicar um rascunho, mova o arquivo para `_posts/` e acrescente a data no começo do nome.

## Antes de enviar

- Leia o texto em voz alta uma vez. Frases que travam na leitura costumam travar para quem lê.
- Explique siglas na primeira vez que aparecem.
- Cite as fontes com link.
- Dados de pessoas, só agregados e públicos.
