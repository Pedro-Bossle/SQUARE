# SQuaRE Quest — ISO/IEC 25010:2023

Jogo educacional de auditoria de qualidade de software baseado na **ISO/IEC 25010:2023**.

## Equipe

**Disciplina:** Qualidade e Auditoria de Tecnologia da Informação — 2026/02  
**Professora:** Stéfani Mano Valmini

**Integrantes:**
- Pedro Bossle Sandi
- Carla Regina Hentschel
- Valdomiro Rehbein Junior

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

O placar usa o Supabase. O jogo lê `.env` e, se existir, `.env.local`, com `SUPABASE_URL` e `SUPABASE_ANON_KEY` (chave publishable ou anon). A tabela é `square_leaderboard` (veja `supabase/migrations`) e guarda também a nota de 0 a 5 e um comentário de até 150 caracteres. Se o arquivo, a chave ou o banco não estiver disponível, o jogo abre sem o placar.

## Estrutura

| Arquivo | Função |
|--------|--------|
| `index.html` | Entrada do Pages / quiz |
| `css/styles.css` | Interface |
| `js/quiz.js` | Lógica |
| `data/quiz-data.json` | Perguntas e respostas |
| `data/docs.json` | Documentação da central no app |
| `LEIA-ME.txt` | Readme em texto do pacote acadêmico |
| `.env.example` | Modelo das variáveis do Supabase |

## Editar o banco de questões

Edite `data/quiz-data.json`. O campo `correct` é o índice (começando em 0) da alternativa correta em `options`.

## Documentação no app

No quiz, use **Documentação** para abrir a central integrada (equipe, como jogar, material, arquivos, referências e o LEIA-ME completo).

## Norma

Modelo de qualidade do produto: **ISO/IEC 25010:2023**. Quality-in-use: **ISO/IEC 25019:2023**.
