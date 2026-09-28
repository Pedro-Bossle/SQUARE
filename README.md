# SQuaRE Quest — ISO/IEC 25010:2023

Jogo educacional de auditoria de qualidade de software baseado na **ISO/IEC 25010:2023**.

## Jogar online (GitHub Pages)

1. Publique este repositório no GitHub.
2. Em **Settings → Pages**, selecione a branch `main` (ou `master`) e a pasta `/` (root).
3. Acesse: `https://SEU-USUARIO.github.io/NOME-DO-REPO/`

O arquivo `index.html` é a entrada automática do Pages.

## Jogar localmente

```bash
python -m http.server 8080
```

Abra [http://localhost:8080/](http://localhost:8080/).

## Estrutura

| Arquivo | Função |
|--------|--------|
| `index.html` | Entrada do Pages / quiz |
| `css/styles.css` | Interface |
| `js/quiz.js` | Lógica |
| `data/quiz-data.json` | Perguntas e respostas |
| `data/docs.json` | Documentação da central no app |
| `LEIA-ME.txt` | Readme em texto do pacote acadêmico |

## Editar o banco de questões

Edite `data/quiz-data.json`. O campo `correct` é o índice (começando em 0) da alternativa correta em `options`.

## Documentação no app

No quiz, use **Documentação** para abrir a central integrada (como jogar, material, GitHub Pages, entrega, norma, referências e o LEIA-ME completo).

## Norma

Modelo de qualidade do produto: **ISO/IEC 25010:2023**. Quality-in-use: **ISO/IEC 25019:2023**.
