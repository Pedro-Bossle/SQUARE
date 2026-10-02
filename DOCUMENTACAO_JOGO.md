# DOCUMENTAÇÃO DO JOGO — página dedicada no site do SQuaRE Quest

> **Para o agente de código (Cursor), no repositório `pedro-bossle/SQUARE`.** A entrega é **hoje (02/10/2026)**.
> Objetivo: publicar no site uma **página de documentação completa** com o conteúdo do PDF corrigido (`SQUARE_Documentacao_Final.pdf`) e aplicar duas correções que sobraram no jogo.
> Idioma: **pt-BR**. **Sem subtítulos em inglês** (nada de "Functional suitability" e similares abaixo dos nomes). Mantenha o visual atual do site.
> **Não invente** dados de teste, duração de partida nem participantes. **Não altere** `supabase/migrations/` nem a quantidade de questões (42 de setor + 9 da Auditoria Final).

## Parte 1 — Integração (passo a passo)

### 1.1 Criar a página `documentacao.html` (na raiz do repositório)
- Use a raiz (ao lado de `index.html`) para que os caminhos `css/…` e `js/…` funcionem igual no GitHub Pages.
- HTML **estático**: converta o conteúdo da **Parte 3** para HTML direto no arquivo, sem renderizar Markdown em tempo de execução e sem biblioteca externa.
- `<html lang="pt-BR" data-theme="audit">`, `<meta charset="utf-8">`, `<meta name="viewport" …>` e `<title>Documentação — SQuaRE Quest</title>`.
- Estilo: carregue `css/styles.css?v=<ASSET_VERSION>` para herdar fontes, cores e temas. Crie `css/documentacao.css` só com o necessário para leitura longa:
  - coluna de texto com `max-width: 860px`, `line-height: 1.6`, tamanho da fonte do corpo ≥ 16px;
  - tabelas com borda `1px solid var(--line)`, `th` com fundo `var(--panel)` e `overflow-x:auto` em telas estreitas;
  - `h2`/`h3` na fonte de display do tema, mas o corpo na fonte de texto (`var(--font)`), porque a fonte pixel não serve para parágrafos longos;
  - `@media print` com fundo branco e texto preto, para a página poder ser impressa.
- Topo da página: título "Documentação completa — SQuaRE Quest", a linha "ISO/IEC 25010:2023 · Qualidade e Auditoria de Tecnologia da Informação — 2026/02", um botão/link **"> VOLTAR AO JOGO"** para `index.html` e um **sumário com âncoras** (`#introducao`, `#square`, `#iso25010`, `#modelo`, `#aplicacao`, `#jogo`, `#conclusao`, `#referencias`, `#apendice-a`, `#apendice-b`).
- Cada `##`/`###` da Parte 3 vira `<h2 id="…">`/`<h3 id="…">` com id sem acentos.
- Rodapé igual ao de `index.html`: disciplina, "Professora Stéfani Mano Valmini" e os 3 integrantes.
- **Figuras:** o PDF tem duas imagens que não estão no repositório (diagrama "Arquitetura da família SQuaRE" e captura da tela principal). **Não as recrie.** A tabela de divisões da seção 2.3 já cobre o conteúdo do diagrama. O QR code também não vai para a página.
- Acessibilidade: tabelas com `<th scope="col">`, links com texto descritivo e uma única `<h1>`.

### 1.2 Linkar a página
1. **`index.html` e `SQUARE_Quiz.html`**, no `.top-nav` (ao lado do botão `id="btnDocsHeader"` "Guia"): adicione `<a class="nav-link" href="documentacao.html">Documentação</a>`.
2. **Central de documentação (`data/docs.json` + `js/quiz.js`)**:
   - Em `js/quiz.js`, na função `renderDocsSection` (~l.983), no `switch`/mapeamento de tipos de bloco, crie o tipo `"link"`, que renderiza `<p><a class="docs-link primary" href="${escapeHtml(block.href)}">${escapeHtml(block.text)}</a></p>`.
   - Em `data/docs.json`, na seção `"id": "material"`, adicione como **primeiro** bloco depois do `lead`:
     `{ "type": "link", "text": "> ABRIR A DOCUMENTAÇÃO COMPLETA", "href": "documentacao.html" }`
3. **`README.md`**: na seção "## Documentação no app", acrescente:
   `A documentação completa (pesquisa, modelo de qualidade, regras, apêndices A e B e referências) está em [documentacao.html](https://pedro-bossle.github.io/SQUARE/documentacao.html).`
4. **`LEIA-ME.txt`**, na lista ESTRUTURA DO JOGO: acrescente `documentacao.html                      — documentação completa (conteúdo do PDF)` e `css/documentacao.css                   — estilos da documentação`.
5. Em `data/docs.json`, seção `"files"`, acrescente `{ "path": "documentacao.html", "desc": "Documentação completa (conteúdo do PDF)" }`.

### 1.3 Manter a página sincronizada com o jogo
- As tabelas das seções 4.1 a 4.9 e os Apêndices A e B da Parte 3 foram gerados a partir de `data/quiz-data.json` no commit `1a85c85`. Se alterar alguma questão, atualize também a página e avise que o PDF precisa ser regerado.
- Se for mais simples, você **pode** gerar as seções 4.x e os apêndices em tempo de execução, lendo `data/quiz-data.json` (o mesmo `fetch` com `?v=${ASSET_VERSION}` que `quiz.js` já usa). Nesse caso, mantenha exatamente o formato da Parte 3: "A1. Característica - Subcaracterística", enunciado, "Alternativas: a | b | c | d", "Gabarito: resposta - explicação", **na ordem do arquivo**, numerando A1–A42 e B1–B9.

## Parte 2 — Correções que sobraram no jogo e na documentação

### 2.1 Tirar os subtítulos em inglês dos cards de setor — *Alinhamento (pt-BR)*
`js/quiz.js`:
- `sealLabel` (~l.130-136): apague a linha `<span class="muted">${c.en}</span>`.
- Mapa de setores (~l.176): `title="${c.pt} (${c.en})"` → `title="${c.pt}"`.
- Intro do setor, `showStageIntro` (~l.364): apague a linha `<p class="muted" style="margin:0">${c.en}</p>`.
- Confira com `rg -n '\$\{c\.en\}|\$\{s\.en\}|\.en\b' js/quiz.js`: não pode sobrar nenhum uso visível ao jogador. O campo `en` pode continuar em `quiz-data.json`, porque não aparece na tela.

### 2.2 "18×100 setores" → "18×100 questões" — *Qualidade (forma)*
`data/docs.json` ~l.55: `{ "value": "18×100", "label": "setores" }` → `{ "value": "18×100", "label": "questões" }`.

### 2.3 Tirar promessas que o PDF final não cumpre — *Qualidade 50%*
O PDF final **não tem** seção "Teste do protótipo", porque não existe registro real de teste no repositório, e **não informa duração**, porque nenhuma duração foi medida. Por isso:
- `data/docs.json`, seção `material`, lista `items`:
  - `"Regras, número de jogadores, duração, fluxo e pontuação do jogo"` → `"Regras, componentes, número de jogadores, fluxo e pontuação do jogo"`
  - apague `"Teste do protótipo (registro do teste real)"`
  - apague o bloco `note` com `"Teste do protótipo: registrado no PDF do trabalho (seção Teste do protótipo). [PREENCHER com teste real: data, participantes, observações]"`
- `LEIA-ME.txt`:
  - `- regras, número de jogadores, duração, fluxo e pontuação do jogo;` → `- regras, componentes, número de jogadores, fluxo e pontuação do jogo;`
  - apague `- teste do protótipo (registro do teste real);`
  - apague a seção inteira `REGISTRO DE TESTE DO PROTÓTIPO` (título e as 2 linhas abaixo).
- Quando houver um teste real, a equipe acrescenta a seção de volta, aqui e no PDF.

### 2.4 Referência ISO/IEC 9126-1 (o PDF agora tem) — *Referências 10%*
`data/quiz-data.json`, array `references`: logo **depois** do item que começa com `"INTERNATIONAL ORGANIZATION FOR STANDARDIZATION. ISO/IEC 25010:2011"`, acrescente:
`"INTERNATIONAL ORGANIZATION FOR STANDARDIZATION; INTERNATIONAL ELECTROTECHNICAL COMMISSION. ISO/IEC 9126-1:2001 - Software engineering - Product quality - Part 1: Quality model. Geneva: ISO, 2001. Edição retirada.",`
A lista fica com 10 itens, na mesma ordem da seção 8 do PDF.

### 2.5 Cache
Incremente `ASSET_VERSION` em `js/quiz.js` e o `?v=` do `<script>` em `index.html`/`SQUARE_Quiz.html`, usando o mesmo valor no `<link>` de CSS da nova página.

## Verificação (checklist)
- [ ] `documentacao.html` abre localmente (`python -m http.server 8080` → http://localhost:8080/documentacao.html) e em https://pedro-bossle.github.io/SQUARE/documentacao.html após o push (Ctrl+F5).
- [ ] A página mostra: 1 Introdução, 2 SQuaRE (2.1–2.3), 3 ISO/IEC 25010:2023 (3.1–3.2, com a tabela 2011×2023 e a correspondência 9126×2011×2023), 4 Modelo (4.1–4.9, 40 subcaracterísticas), 5 Aplicação prática, 6 SQuaRE Quest (6.1–6.5), 7 Conclusão, 8 Referências (10 itens), Apêndice A (A1–A42) e Apêndice B (B1–B9).
- [ ] O sumário com âncoras funciona e o botão "> VOLTAR AO JOGO" leva a `index.html`.
- [ ] Os links para a página aparecem no `.top-nav` de `index.html` e `SQUARE_Quiz.html`, na aba "O material" da central de documentação e no README.
- [ ] Nenhum subtítulo em inglês nos cards de setor, no mapa nem na intro do setor; na página nova, os títulos 4.x e as tabelas não têm nome em inglês.
- [ ] `rg -n '"label": "setores"' data/docs.json` retorna vazio, e o KPI na central mostra "18×100 questões".
- [ ] `rg -n -i "duração|teste do protótipo|PREENCHER" data/docs.json LEIA-ME.txt` retorna vazio.
- [ ] `python3 -c "import json;d=json.load(open('data/quiz-data.json'));print(len(d['questions']),len(d['bossQuestions']),len(d['references']))"` imprime `42 9 10`.
- [ ] O texto de jogadores é idêntico na página, em `docs.json`, no `LEIA-ME.txt` e no PDF: "1 jogador ou 1 equipe de 2 a 4 pessoas no mesmo dispositivo, discutindo juntas cada resposta. Para competir, cada jogador ou equipe joga uma partida e compara a pontuação no placar global."
- [ ] A página é legível no celular (tabelas com rolagem horizontal) e imprime em fundo branco.
- [ ] Jogue uma partida completa e confira que nada quebrou (setores → Auditoria Final → relatório → placar).

## Parte 3 — Conteúdo completo da página (espelha o PDF corrigido)

> Converta este conteúdo para HTML na página. A capa e o sumário do PDF não entram (o sumário vira o índice com âncoras do topo).
> Na página, o link "https://pedro-bossle.github.io/SQUARE/" da seção 6.1 pode ser um `<a>`.

## 1. INTRODUÇÃO

A qualidade de software não se resume à ausência de erros. Ela envolve a capacidade de um produto atender necessidades explícitas e implícitas de seus stakeholders, funcionar com desempenho adequado, proteger informações, permanecer confiável, ser utilizável e evoluir sem custos desnecessários. A família ISO/IEC 25000, conhecida como SQuaRE, organiza requisitos, modelos, medidas e processos de avaliação para apoiar essa análise de forma sistemática.

O material da disciplina apresenta a SQuaRE como evolução e reorganização das séries ISO/IEC 9126 e ISO/IEC 14598. Ele também identifica a ISO/IEC 25010 como o guia/modelo de qualidade da família. A pesquisa foi atualizada com a edição vigente ISO/IEC 25010:2023, publicada em novembro de 2023, que substituiu a edição de 2011.

O presente trabalho tem por objetivo pesquisar a origem, a estrutura e a aplicação da família SQuaRE, aprofundar o estudo do modelo de qualidade de produto ISO/IEC 25010:2023 e transformar suas características e subcaracterísticas em um jogo educativo baseado em situações práticas de auditoria de software.

## 2. SQuaRE - Systems and Software Quality Requirements and Evaluation

### 2.1. Origem e evolução

A SQuaRE (Systems and software Quality Requirements and Evaluation) foi criada para integrar e reorganizar conceitos antes distribuídos principalmente entre a ISO/IEC 9126, associada aos modelos e métricas de qualidade, e a ISO/IEC 14598, associada ao processo de avaliação de produtos de software. A ISO/IEC 25000:2014 descreve explicitamente essa transição e fornece uma visão geral da série.

- 1999 - o material da disciplina registra a proposta inicial da SQuaRE em reunião realizada em Kanazawa.
- 2000 - o material da disciplina registra a aprovação da proposta pelo comitê de normas da ISO em reunião de Madri.
- 2005 - o material didático registra o lançamento da primeira versão da ISO/IEC 25000.
- 2011 - a ISO/IEC 25010:2011 consolidou, em um único documento, um modelo de qualidade do produto com 8 características e um modelo de qualidade em uso com 5 características.
- 2023 - a ISO/IEC 25010:2023 publicou a segunda edição, agora centrada no modelo de qualidade do produto com 9 características.
- 2023 - o modelo de qualidade em uso passou a ser tratado separadamente pela ISO/IEC 25019:2023.
- 2024 - a ISO registra a retirada formal da edição ISO/IEC 25010:2011, substituída pelas normas mais recentes da família.

### 2.2. Objetivos da SQuaRE

A família SQuaRE tem como objetivo estabelecer uma estrutura organizada para especificar requisitos, definir modelos, realizar medições e avaliar a qualidade de sistemas e produtos de software. Dessa forma, suas normas fornecem uma base comum para diferentes atividades relacionadas à qualidade ao longo do ciclo de vida do produto. Entre seus principais objetivos, destacam-se:

- Apoiar o levantamento e a definição de requisitos de qualidade.
- Verificar se a especificação de requisitos está suficientemente completa.
- Orientar objetivos de arquitetura e projeto relacionados à qualidade.
- Ajudar a definir objetivos de teste e critérios de controle da qualidade.
- Estabelecer critérios de aceitação de produtos e sistemas.
- Apoiar a seleção e o estabelecimento de medidas de qualidade.
- Oferecer terminologia comum para desenvolvedores, adquirentes, QA/QC, auditores e avaliadores independentes.

### 2.3. Estrutura da família SQuaRE

A família SQuaRE é composta por um conjunto de normas da série ISO/IEC 25000, organizadas de acordo com diferentes aspectos relacionados à qualidade de sistemas e produtos de software. Essa organização permite abordar a qualidade de maneira estruturada, desde o planejamento e a definição dos requisitos até a medição e a avaliação do produto.

As normas são agrupadas em **cinco divisões principais**, identificadas por faixas numéricas dentro da série ISO/IEC 25000. Além dessas divisões, a família prevê a faixa **ISO/IEC 25050 a 25099** para extensões destinadas a domínios e necessidades específicas.

As funções de cada divisão são apresentadas de forma resumida a seguir:

| Divisão | Finalidade | Exemplos |
| --- | --- | --- |
| **2500n — Gestão da Qualidade** | Apresenta conceitos gerais da SQuaRE e orientações para planejamento e gestão da qualidade. | ISO/IEC 25000 e ISO/IEC 25001 |
| **2501n — Modelos de Qualidade** | Define modelos utilizados para representar diferentes aspectos da qualidade. É nesta divisão que se encontra a ISO/IEC 25010. | ISO/IEC 25010 e ISO/IEC 25012 |
| **2502n — Medição da Qualidade** | Estabelece referências e orientações para definir e utilizar medidas de qualidade. | ISO/IEC 25020, 25021, 25022, 25023 e 25024 |
| **2503n — Requisitos de Qualidade** | Orienta a especificação dos requisitos relacionados à qualidade do produto. | ISO/IEC 25030 |
| **2504n — Avaliação da Qualidade** | Trata dos processos e métodos utilizados para avaliar a qualidade. | ISO/IEC 25040, 25041, 25042 e 25045 |

Dentro dessa estrutura, a ISO/IEC 25010 integra a divisão 2501n, dedicada aos modelos de qualidade. Essa norma é especialmente relevante para este trabalho por definir o modelo de qualidade de produto utilizado como base teórica para a construção do SQuaRE Quest. A edição ISO/IEC 25010:2023 e suas principais características serão apresentadas no capítulo seguinte.

## 3. ISO/IEC 25010:2023

### 3.1. Conceito e objetivos

A ISO/IEC 25010:2023 integra a família SQuaRE e estabelece um modelo de qualidade de produto aplicável a produtos de Tecnologia da Informação e Comunicação (TIC) e produtos de software. O modelo organiza a qualidade em um conjunto de características e subcaracterísticas, permitindo analisar diferentes propriedades relevantes para a qualidade de um produto ao longo de seu ciclo de vida.

O modelo pode ser utilizado como referência em diferentes atividades relacionadas ao desenvolvimento e à avaliação de software, contribuindo para a definição de requisitos de qualidade, o estabelecimento de objetivos de projeto e arquitetura, a elaboração de critérios de teste e aceitação e a definição de medidas para avaliação da qualidade.

Além disso, a ISO/IEC 25010 fornece uma terminologia comum que facilita a comunicação entre diferentes envolvidos no ciclo de vida do produto, como desenvolvedores, analistas, equipes de qualidade, adquirentes, auditores e avaliadores.

Na edição de 2023, o modelo de qualidade do produto é composto por nove características, que abrangem diferentes perspectivas da qualidade e são detalhadas por meio de suas respectivas subcaracterísticas. Essas características serão apresentadas e analisadas nas seções seguintes.

### 3.2. Evolução da ISO/IEC 25010:2011 para 2023

A ISO/IEC 25010:2023 corresponde à segunda edição da norma e substitui a versão publicada em 2011. A atualização trouxe mudanças na estrutura e no escopo do modelo, buscando adequá-lo à evolução dos sistemas e produtos de software.

Na edição de 2011, a ISO/IEC 25010 reunia em um mesmo documento dois modelos: o modelo de qualidade do produto, composto por oito características, e o modelo de qualidade em uso, composto por cinco características. Na edição de 2023, a norma passou a concentrar-se no modelo de qualidade do produto, que foi ampliado para nove características. O modelo de qualidade em uso passou a ser tratado separadamente pela ISO/IEC 25019:2023, e a visão geral e o uso dos modelos de qualidade passaram para a ISO/IEC 25002:2024.

Entre as principais alterações da edição de 2023 estão a reformulação de algumas características e a inclusão de novos aspectos de qualidade. A característica anteriormente denominada Usabilidade (Usability) foi ampliada e passou a ser denominada Capacidade de Interação (Interaction Capability). Da mesma forma, Portabilidade (Portability) foi reformulada como Flexibilidade.

Outra mudança relevante foi a inclusão de Segurança Operacional (Safety) como uma característica independente do modelo. Ela está relacionada à capacidade do produto de evitar situações que possam colocar em risco a vida, a saúde, propriedades ou o meio ambiente.

Também ocorreram alterações nas subcaracterísticas. Conceitos como Inclusão (Inclusivity), Autodescrição (Self-descriptiveness), Resistência (Resistance) e Escalabilidade (Scalability) passaram a integrar ou ganhar destaque no modelo atualizado. Na característica Confiabilidade, por exemplo, a antiga denominação Maturidade (Maturity) foi substituída por Inexistência de Falhas (Faultlessness). Na Capacidade de Interação, a antiga Estética da interface do usuário passou a ser Envolvimento do usuário (User engagement), e a antiga Acessibilidade deu lugar a Inclusão (Inclusivity) e Assistência ao usuário (User assistance).

A ISO/IEC 25010 tem origem na ISO/IEC 9126, que organizava a qualidade de software em seis características (funcionalidade, confiabilidade, usabilidade, eficiência, manutenibilidade e portabilidade) e a analisava sob três visões: qualidade interna, qualidade externa e qualidade em uso. Em 2011, a ISO/IEC 25010 substituiu a ISO/IEC 9126-1, e o modelo passou a ter oito características: segurança, antes subcaracterística de funcionalidade, virou característica, e foi criada a compatibilidade, que reúne a interoperabilidade (antes em funcionalidade) e a coexistência (antes em portabilidade). Na edição de 2023, o modelo de produto chegou a nove características, e a qualidade em uso foi para a ISO/IEC 25019.

| Aspecto | ISO/IEC 25010:2011 | ISO/IEC 25010:2023 |
| --- | --- | --- |
| Escopo | Qualidade do produto + qualidade em uso | Qualidade do produto |
| Características do produto | 8 | 9 |
| Qualidade em uso | Incluída na ISO/IEC 25010 | Tratada pela ISO/IEC 25019:2023 |
| Usabilidade | Usability | Interaction Capability |
| Portabilidade | Portability | Flexibility |
| Safety | Não era uma característica independente | Passa a ser uma característica do modelo |
| Subcaracterísticas | Estrutura anterior | Inclusão, Autodescrição, Resistência e Escalabilidade ganham destaque/entrada; outras denominações são atualizadas |

Correspondência entre ISO/IEC 9126, ISO/IEC 25010:2011 e ISO/IEC 25010:2023

| ISO/IEC 9126 | ISO/IEC 25010:2011 | ISO/IEC 25010:2023 |
| --- | --- | --- |
| Funcionalidade | Adequação funcional | Adequação funcional |
| (Segurança era subcaracterística de Funcionalidade) | Segurança | Segurança da informação |
| (Interoperabilidade em Funcionalidade; Coexistência em Portabilidade) | Compatibilidade | Compatibilidade |
| Confiabilidade | Confiabilidade | Confiabilidade |
| Usabilidade | Usabilidade | Capacidade de interação |
| Eficiência | Eficiência de desempenho | Eficiência de desempenho |
| Manutenibilidade | Manutenibilidade | Manutenibilidade |
| Portabilidade | Portabilidade | Flexibilidade |
| — | — | Segurança operacional |
| Qualidade em uso (9126-1 e 9126-4) | Qualidade em uso (na própria 25010) | ISO/IEC 25019:2023 |

Fonte: Elaborado pelos autores (2026), com base nas normas ISO/IEC 9126-1:2001, ISO/IEC 25010:2011 e ISO/IEC 25010:2023.

## 4. MODELO DE QUALIDADE DO PRODUTO

### 4.1. Adequação funcional

Avalia se o produto entrega as funções necessárias e se essas funções produzem resultados corretos e ajudam o usuário a concluir suas tarefas.

Pergunta-chave: O produto faz aquilo que precisa fazer, corretamente e de forma adequada?

| Subcaracterística | Resumo prático |
| --- | --- |
| Completude funcional | As funções disponíveis cobrem todas as tarefas e objetivos previstos para os usuários. |
| Correção funcional | As funções fornecem resultados corretos e com a precisão esperada. |
| Aptidão funcional | As funções facilitam a realização das tarefas e objetivos, sem etapas desnecessárias. |

### 4.2. Eficiência de desempenho

Avalia tempo de resposta, vazão, uso de recursos e limites de capacidade enquanto o produto executa suas funções.

Pergunta-chave: O produto responde no tempo esperado, usa recursos de forma adequada e suporta a carga necessária?

| Subcaracterística | Resumo prático |
| --- | --- |
| Comportamento no tempo | Os tempos de resposta, processamento e taxas de transferência atendem aos requisitos. |
| Utilização de recursos | CPU, memória, armazenamento, rede, energia e outros recursos são usados dentro dos limites definidos. |
| Capacidade | Os limites máximos do produto, como usuários simultâneos, volume de dados ou transações, atendem à necessidade. |

### 4.3. Compatibilidade

Avalia a capacidade de o produto coexistir com outros produtos no mesmo ambiente e trocar informações de forma útil com eles.

Pergunta-chave: O produto convive e troca informações corretamente com outros sistemas?

| Subcaracterística | Resumo prático |
| --- | --- |
| Coexistência | O produto compartilha ambiente e recursos com outros produtos sem causar impacto prejudicial. |
| Interoperabilidade | O produto troca informações com outros produtos e consegue utilizar a informação recebida. |

### 4.4. Capacidade de interação

Avalia os atributos que permitem a usuários específicos interagir com o produto pela interface para concluir tarefas em diferentes contextos. (Na edição 2011: Usabilidade.)

Pergunta-chave: A interação com o produto é compreensível, aprendível, controlável e inclusiva?

| Subcaracterística | Resumo prático |
| --- | --- |
| Reconhecimento de adequação | O usuário consegue reconhecer que o produto é adequado às suas necessidades. |
| Capacidade de aprendizado | Usuários conseguem aprender as funções necessárias dentro do tempo esperado. |
| Operabilidade | O produto é fácil de operar e controlar. |
| Proteção contra erros do usuário | O produto previne ou reduz erros de operação do usuário. |
| Envolvimento do usuário | A interface apresenta funções e informações de forma convidativa e motivadora. (Na edição 2011: Estética da interface do usuário.) |
| Inclusão | O produto pode ser utilizado por pessoas de origens e perfis diversos, como diferentes idades, habilidades, culturas, etnias, idiomas, gêneros, situações econômicas, níveis de educação, localizações e situações de vida. (Na edição 2011, ambas faziam parte de Acessibilidade.) |
| Assistência ao usuário | O produto pode ser usado por pessoas com a mais ampla gama de características e capacidades (por exemplo, visão, audição, uso das mãos, idioma) para atingir seus objetivos. Na edição 2023, é aqui que se aplicam as regras de acessibilidade. (Na edição 2011, ambas faziam parte de Acessibilidade.) |
| Autodescrição | A própria interface fornece informações suficientes para tornar seu estado, capacidades e uso compreensíveis sem depender excessivamente de ajuda externa. |

### 4.5. Confiabilidade

Avalia se o produto executa suas funções de forma estável pelo período necessário, permanece disponível, tolera falhas e se recupera quando necessário.

Pergunta-chave: O produto continua funcionando de forma confiável e consegue se recuperar de falhas?

| Subcaracterística | Resumo prático |
| --- | --- |
| Inexistência de falhas | O produto executa as funções especificadas sem falhas durante a operação normal. (Na edição 2011: Maturidade.) |
| Disponibilidade | O produto está operacional e acessível quando seu uso é necessário. |
| Tolerância a falhas | O produto continua operando como previsto mesmo quando ocorrem falhas de hardware ou software. |
| Recuperabilidade | Após uma interrupção ou falha, o produto recupera dados afetados e restabelece o estado desejado. |

### 4.6. Segurança da informação

Avalia a proteção contra ataques e o controle apropriado de acesso, alteração, autoria e rastreabilidade de dados e operações.

Pergunta-chave: Dados, identidades e operações estão protegidos contra acesso, alteração e ataques indevidos?

| Subcaracterística | Resumo prático |
| --- | --- |
| Confidencialidade | Dados ficam acessíveis apenas às pessoas, produtos ou sistemas autorizados. |
| Integridade | Dados e estado do sistema ficam protegidos contra alteração ou exclusão não autorizada ou acidental. |
| Não repúdio | Existem evidências de que uma ação ou evento ocorreu, impedindo que seja negado posteriormente. |
| Responsabilização | As ações podem ser rastreadas de forma única até a entidade responsável. |
| Autenticidade | É possível comprovar que a identidade de uma pessoa, serviço ou recurso é realmente a identidade alegada. |
| Resistência | O produto mantém operações essenciais enquanto está sob ataque de um agente malicioso. |

### 4.7. Manutenibilidade

Avalia a eficácia e eficiência para compreender, modificar, corrigir, evoluir e testar o produto.

Pergunta-chave: O produto pode ser analisado, alterado e testado sem gerar impactos desnecessários?

| Subcaracterística | Resumo prático |
| --- | --- |
| Modularidade | O produto é dividido em componentes de modo que alterações locais tenham pouco impacto nos demais. |
| Reutilização | Partes do produto podem ser reutilizadas em outros sistemas ou na construção de novos ativos. |
| Capacidade de análise | É possível avaliar impactos de mudanças, localizar causas de falhas e identificar o que precisa ser modificado. |
| Modificabilidade | Mudanças podem ser feitas de forma eficaz sem introduzir defeitos nem degradar a qualidade existente. |
| Testabilidade | Critérios de teste podem ser definidos e os testes executados de forma eficaz para verificar se foram atendidos. |

### 4.8. Flexibilidade

Avalia a capacidade do produto de se adaptar a mudanças de requisitos, contextos de uso e ambientes de sistema. (Na edição 2011: Portabilidade.)

Pergunta-chave: O produto consegue se adaptar, escalar, ser instalado e substituir soluções em ambientes diferentes?

| Subcaracterística | Resumo prático |
| --- | --- |
| Adaptabilidade | O produto pode ser adaptado ou transferido para diferentes ambientes de hardware, software ou uso. |
| Escalabilidade | O produto lida com aumento ou redução de carga e adapta sua capacidade à variabilidade. |
| Instalabilidade | O produto pode ser instalado e removido com eficácia e eficiência no ambiente especificado. |
| Substituibilidade | O produto pode substituir outro produto especificado para a mesma finalidade no mesmo ambiente. |

### 4.9. Segurança operacional

Avalia a capacidade do produto de evitar estados que coloquem em risco vida, saúde, propriedade ou meio ambiente. (Característica nova na edição 2023.)

Pergunta-chave: O produto evita ou reduz situações perigosas e mantém a operação dentro de condições seguras?

| Subcaracterística | Resumo prático |
| --- | --- |
| Restrição operacional | O produto limita sua operação a parâmetros e estados seguros diante de um perigo operacional. |
| Identificação de riscos | O produto identifica sequências de eventos ou operações que podem expor pessoas, bens ou ambiente a risco inaceitável. |
| À prova de falhas | Quando ocorre uma falha, o produto entra automaticamente em modo seguro ou retorna a uma condição segura. |
| Aviso de perigo | O produto alerta sobre riscos inaceitáveis com antecedência suficiente para permitir reação segura. |
| Integração segura | O produto mantém a segurança durante e depois da integração com outros componentes. |

## 5. APLICAÇÃO PRÁTICA DA ISO/IEC 25010:2023

Considere um sistema corporativo de pedidos. A ISO/IEC 25010 pode ser usada para transformar expectativas genéricas em critérios de qualidade observáveis. A norma não determina uma única métrica obrigatória para todos os produtos; o contexto e os requisitos precisam orientar a escolha das medidas.

| Característica | Exemplo de requisito | Como verificar |
| --- | --- | --- |
| Adequação funcional | 100% das regras obrigatórias de cálculo devem estar implementadas e produzir resultados corretos. | Testes funcionais baseados em requisitos e cenários de negócio. |
| Eficiência de desempenho | 95% das consultas críticas devem responder em até 2 segundos com 500 usuários simultâneos. | Teste de carga, medição de latência, throughput, CPU e memória. |
| Compatibilidade | O sistema deve trocar pedidos e status com o ERP por API sem perda de informação. | Testes de contrato e interoperabilidade. |
| Capacidade de interação | Usuários novos devem concluir o fluxo principal após treinamento curto, inclusive com navegação por teclado. | Teste de usabilidade e acessibilidade com usuários e tecnologias assistivas. |
| Confiabilidade | Disponibilidade mensal mínima de 99,9% e restauração dos dados críticos após falha. | Monitoramento, testes de failover e restauração. |
| Segurança da informação | Somente perfis autorizados acessam dados sensíveis; operações críticas são rastreáveis. | Teste de controle de acesso, logs, análise de segurança e pentest conforme escopo. |
| Manutenibilidade | Mudanças em um módulo devem gerar impacto limitado e ser cobertas por testes automatizados. | Análise de dependências, revisão de código e testes de regressão. |
| Flexibilidade | A aplicação deve suportar crescimento de carga e implantação em ambientes homologados. | Teste de escalabilidade, configuração e instalação. |
| Segurança operacional | Falhas críticas em componentes de controle devem levar o sistema a estado seguro e gerar alerta. | Análise de risco e testes de falhas críticas em ambiente controlado. |

## 6. SQUARE QUEST — APLICAÇÃO DO CONTEÚDO NO JOGO

### 6.1. Proposta

O SQuaRE Quest foi desenvolvido como aplicação prática dos conceitos estudados na ISO/IEC 25010:2023. O jogador assume o papel de integrante de uma equipe de auditoria responsável por avaliar o produto fictício NEXUS-9, que está prestes a entrar em produção.

O jogo está disponível para acesso em: https://pedro-bossle.github.io/SQUARE/

### 6.2. Objetivo pedagógico

- Diferenciar as nove características de qualidade do produto da edição 2023.
- Reconhecer as subcaracterísticas da ISO/IEC 25010:2023 por meio de situações práticas selecionadas a partir de um banco de desafios.
- Aplicar o modelo a incidentes de desenvolvimento, operação, segurança, UX e sistemas críticos.
- Compreender a evolução da edição 2011 para a edição 2023.
- Relacionar qualidade a requisitos, testes, auditoria e critérios de aceitação.

### 6.3. Como jogar

O SQuaRE Quest é um jogo digital de perguntas e respostas no qual o jogador assume o papel de integrante de uma equipe de auditoria responsável por avaliar a qualidade do sistema fictício NEXUS-9 antes de sua liberação para produção.

**Jogadores:** 1 jogador ou 1 equipe de 2 a 4 pessoas no mesmo dispositivo, discutindo juntas cada resposta. Para competir, cada jogador ou equipe joga uma partida e compara a pontuação no placar global.

Para iniciar a partida, o jogador ou a equipe deve informar seu nome e iniciar a auditoria. O jogo é dividido em nove setores, cada um correspondente a uma das características do modelo de qualidade de produto da ISO/IEC 25010:2023.

Antes de iniciar os desafios de cada setor, é apresentado um resumo da característica que será avaliada e de suas respectivas subcaracterísticas. Em seguida, o sistema sorteia dois desafios do banco de questões correspondente àquela característica. Cada desafio apresenta uma situação prática relacionada à qualidade de software, e o jogador deve analisar o cenário e selecionar a subcaracterística que melhor representa o problema apresentado.

Após responder à questão, o jogador recebe feedback imediato, indicando a resposta correta e apresentando uma justificativa. Dessa forma, o jogo não tem apenas a finalidade de avaliar o conhecimento, mas também de contribuir para a compreensão e revisão dos conceitos abordados.

Ao concluir os nove setores, é desbloqueada a Auditoria Final. Nessa etapa, são apresentados cinco casos que misturam diferentes características da ISO/IEC 25010:2023, exigindo que o jogador identifique qual delas está mais diretamente relacionada a cada situação.

Ao final da partida, o sistema apresenta um relatório de desempenho, contendo a pontuação obtida, o percentual de acertos, a classificação alcançada e o desempenho do jogador em cada setor. Como as questões dos setores são sorteadas a partir de um banco de desafios, novas partidas podem apresentar situações diferentes, permitindo que o jogo seja utilizado também como ferramenta de revisão do conteúdo.

Resumidamente, a dinâmica do jogo ocorre da seguinte forma:

Início da auditoria → 9 setores de qualidade → 2 desafios sorteados por setor → feedback das respostas → Auditoria Final com 5 casos → relatório de desempenho.

### 6.4. Sistema de pontuação

A pontuação do SQuaRE Quest foi definida de forma a valorizar tanto o desempenho nos nove setores quanto a capacidade de integrar os conhecimentos adquiridos na Auditoria Final. Cada resposta correta nos setores concede 100 pontos, enquanto os acertos na Auditoria Final concedem 200 pontos, totalizando uma pontuação máxima de 2.800 pontos.

| Etapa | Pontuação |
| --- | --- |
| Desafio dos setores | 100 pontos |
| Auditoria Final | 200 pontos |
| **Pontuação máxima** | **2.800 pontos** |

### 6.5. Regras e componentes

**Objetivo:** concluir a auditoria do sistema fictício NEXUS-9 com a maior pontuação possível, diagnosticando corretamente cada incidente de qualidade.

**Componentes:** o jogo é digital e acessado pelo navegador (https://pedro-bossle.github.io/SQUARE/). Os componentes são: 9 setores (um para cada característica da ISO/IEC 25010:2023), um banco de 42 desafios de setor, 9 casos da Auditoria Final, o placar global e o relatório final de desempenho.

**Regras:**

1. O jogador ou a equipe informa um nome e inicia a auditoria.
2. Antes de cada setor, o jogo apresenta a característica e suas subcaracterísticas.
3. Em cada setor, o jogo sorteia 2 desafios do banco daquele setor. Para cada desafio, escolha 1 de 4 alternativas: a subcaracterística que melhor explica o incidente. A ordem das alternativas muda a cada partida.
4. Cada acerto nos setores vale 100 pontos; erros não descontam pontos. Após cada resposta, o jogo mostra a resposta correta e a justificativa.
5. Após os 9 setores, a Auditoria Final sorteia 5 dos 9 casos integradores. Neles, escolha a **característica** mais relacionada ao incidente. Cada acerto vale 200 pontos.
6. Pontuação máxima: 18 questões × 100 + 5 casos × 200 = 2.800 pontos.
7. Ao final, o relatório apresenta pontuação, percentual de acertos, desempenho por setor e revisão dos erros. Em equipe, os integrantes discutem e escolhem juntos cada resposta.
8. A partida pode ser interrompida pelo botão Sair e retomada depois, no mesmo navegador.

## 7. CONCLUSÃO

A ISO/IEC 25010:2023 fornece uma estrutura atualizada para transformar o conceito de qualidade de software em características e subcaracterísticas que podem orientar a especificação e a avaliação de produtos de software. A organização em características e subcaracterísticas ajuda equipes a definir requisitos, orientar testes, revisar critérios de aceitação e realizar avaliações mais consistentes. A edição 2023 amplia o escopo do modelo ao incorporar explicitamente Safety, reformular Usability como Interaction Capability e Portability como Flexibility, além de atualizar diversas subcaracterísticas.

O SQuaRE Quest transforma esse conteúdo em uma experiência de diagnóstico. Em vez de apenas memorizar nomes, o jogador precisa interpretar incidentes e relacioná-los ao modelo, exercitando raciocínio semelhante ao utilizado em atividades de QA, auditoria e engenharia de requisitos.

## 8. REFERÊNCIAS

INTERNATIONAL ORGANIZATION FOR STANDARDIZATION; INTERNATIONAL ELECTROTECHNICAL COMMISSION. **ISO/IEC 25010:2023** - Systems and software engineering - Systems and software Quality Requirements and Evaluation (SQuaRE) - Product quality model. Geneva: ISO, 2023. Disponível em: https://www.iso.org/standard/78176.html. Acesso em: 24 ago. 2026.

INTERNATIONAL ORGANIZATION FOR STANDARDIZATION; INTERNATIONAL ELECTROTECHNICAL COMMISSION. **ISO/IEC 25000:2014** - Systems and software engineering - Systems and software Quality Requirements and Evaluation (SQuaRE) - Guide to SQuaRE. Geneva: ISO, 2014. Disponível em: https://www.iso.org/standard/64764.html. Acesso em: 24 ago. 2026.

INTERNATIONAL ORGANIZATION FOR STANDARDIZATION; INTERNATIONAL ELECTROTECHNICAL COMMISSION. **ISO/IEC 25019:2023** - Systems and software engineering - Systems and software Quality Requirements and Evaluation (SQuaRE) - Quality-in-use model. Geneva: ISO, 2023. Disponível em: https://www.iso.org/standard/78177.html. Acesso em: 24 ago. 2026.

INTERNATIONAL ORGANIZATION FOR STANDARDIZATION; INTERNATIONAL ELECTROTECHNICAL COMMISSION. **ISO/IEC 25002:2024** - Systems and software engineering - Systems and software Quality Requirements and Evaluation (SQuaRE) - Quality model overview and usage. Geneva: ISO, 2024. Disponível em: https://www.iso.org/standard/78175.html. Acesso em: 2 out. 2026.

INTERNATIONAL ORGANIZATION FOR STANDARDIZATION. **ISO/IEC 25010:2011** - Systems and software engineering - Systems and software Quality Requirements and Evaluation (SQuaRE) - System and software quality models. Edição retirada. Disponível em: https://www.iso.org/standard/35733.html. Acesso em: 24 ago. 2026.

INTERNATIONAL ORGANIZATION FOR STANDARDIZATION; INTERNATIONAL ELECTROTECHNICAL COMMISSION. **ISO/IEC 9126-1:2001** - Software engineering - Product quality - Part 1: Quality model. Geneva: ISO, 2001. Edição retirada.

ISO 25000 PORTAL. **The ISO/IEC 25000 series of standards**. Disponível em: https://iso25000.com/. Acesso em: 24 ago. 2026.

INTERNATIONAL SOFTWARE TESTING QUALIFICATIONS BOARD (ISTQB). **Certified Tester Advanced Level - Test Analyst Syllabus**, v. 4.0, 2025. Apêndice F: modelo de qualidade ISO/IEC 25010:2023.

DELLA GIUSTINA, Douglas. **Qualidade e Auditoria de Tecnologia da Informação**. Material didático UNIFTEC. Seção “SQuaRE: ISO/IEC 25000”.

VALMINI, Stéfani Mano. **Qualidade e Auditoria de Tecnologia da Informação** - atividade GRAU A: pesquisa bibliográfica para construção de um jogo. 2026/2.

## Apêndice A - Banco completo de desafios do jogo

O jogo digital utiliza 42 questões de subcaracterísticas: uma para cada uma das 40 subcaracterísticas do modelo e duas adicionais para Compatibilidade, que possui apenas duas subcaracterísticas. Em cada setor, duas questões são sorteadas para a partida. O banco completo permite partidas diferentes e cobre todas as subcaracterísticas do modelo de qualidade do produto apresentado neste trabalho.

**A1. Adequação funcional - Completude funcional**

Um portal de RH permite consultar férias, mas o requisito do projeto também previa solicitar férias pelo próprio sistema. Essa função não foi implementada. Qual subcaracterística foi mais diretamente afetada?

**Alternativas:** Completude funcional | Correção funcional | Aptidão funcional | Interoperabilidade

**Gabarito:** Completude funcional - A função necessária não existe. O problema está na cobertura do conjunto de funções previstas: completude funcional.

**A2. Adequação funcional - Correção funcional**

O módulo de folha de pagamento possui a função de calcular horas extras, mas em determinados casos retorna um valor matematicamente incorreto. Qual subcaracterística está comprometida?

**Alternativas:** Correção funcional | Completude funcional | Capacidade | Modificabilidade

**Gabarito:** Correção funcional - A função existe, porém produz resultado incorreto. Isso caracteriza problema de correção funcional.

**A3. Adequação funcional - Aptidão funcional**

O sistema possui todas as funções para fechar um pedido, mas obriga o usuário a exportar dados para uma planilha e importá-los novamente antes de finalizar a operação. O que está mais comprometido?

**Alternativas:** Aptidão funcional | Correção funcional | Operabilidade | Completude funcional

**Gabarito:** Aptidão funcional - As funções existem, mas não facilitam a conclusão da tarefa: há etapas desnecessárias. Aptidão funcional avalia se as funções ajudam o usuário a alcançar o objetivo. Não é Correção funcional, porque o resultado final está certo.

**A4. Eficiência de desempenho - Comportamento no tempo**

Uma API deveria responder em até 2 segundos, porém leva 12 segundos em condições normais de uso. Qual subcaracterística deve ser analisada primeiro?

**Alternativas:** Comportamento no tempo | Utilização de recursos | Capacidade | Disponibilidade

**Gabarito:** Comportamento no tempo - O requisito violado é diretamente relacionado ao tempo de resposta, portanto comportamento no tempo.

**A5. Eficiência de desempenho - Utilização de recursos**

Um serviço simples mantém a CPU em 95% e consome quase toda a memória do servidor mesmo com poucos usuários. Qual subcaracterística está em foco?

**Alternativas:** Utilização de recursos | Capacidade | Comportamento no tempo | Escalabilidade

**Gabarito:** Utilização de recursos - O problema é a quantidade de CPU e memória usada para executar as funções, caracterizando utilização de recursos.

**A6. Eficiência de desempenho - Capacidade**

O sistema atende aos tempos de resposta e usa poucos recursos, mas foi projetado para no máximo 100 usuários simultâneos e o negócio precisa de 1.000. Qual subcaracterística está insuficiente?

**Alternativas:** Capacidade | Escalabilidade | Comportamento no tempo | Coexistência

**Gabarito:** Capacidade - Capacidade verifica se os limites máximos atuais do produto atendem aos requisitos. Escalabilidade trata da adaptação a cargas variáveis e crescimento.

**A7. Compatibilidade - Coexistência**

Dois sistemas instalados no mesmo servidor funcionam bem separadamente, mas quando executados juntos um deles monopoliza recursos e prejudica o outro. Qual subcaracterística é mais diretamente afetada?

**Alternativas:** Coexistência | Interoperabilidade | Utilização de recursos | Adaptabilidade

**Gabarito:** Coexistência - Coexistência trata de compartilhar o mesmo ambiente e recursos sem prejudicar outros produtos. Utilização de recursos olha o consumo de um produto isolado; aqui o problema só aparece quando os dois rodam juntos.

**A8. Compatibilidade - Interoperabilidade**

O ERP envia pedidos por API, mas o sistema de logística não consegue interpretar os dados recebidos e, por isso, a integração falha. Qual subcaracterística está comprometida?

**Alternativas:** Interoperabilidade | Coexistência | Completude funcional | Correção funcional

**Gabarito:** Interoperabilidade - Há falha na troca e no uso das informações entre sistemas, portanto interoperabilidade.

**A9. Compatibilidade - Coexistência**

Um editor de planilhas e o sistema de ponto estão no mesmo computador. Ao abrir os dois, o editor consome tanta memória que o ponto eletrônico trava. Qual subcaracterística está mais diretamente afetada?

**Alternativas:** Coexistência | Interoperabilidade | Utilização de recursos | Capacidade

**Gabarito:** Coexistência - Os produtos compartilham o mesmo ambiente e um prejudica o outro. Isso é coexistência. Utilização de recursos descreve o consumo do próprio produto, não o conflito entre produtos.

**A10. Compatibilidade - Interoperabilidade**

O caixa envia a venda num arquivo cujo leiaute foi combinado com o estoque, mas o estoque não consegue usar os campos recebidos e a baixa não acontece. Qual subcaracterística está comprometida?

**Alternativas:** Interoperabilidade | Coexistência | Completude funcional | Adaptabilidade

**Gabarito:** Interoperabilidade - A falha está na troca e no uso da informação entre sistemas. Coexistência trata de compartilhar o ambiente sem se prejudicar, não de interpretar dados recebidos.

**A11. Capacidade de interação - Reconhecimento de adequação**

Ao acessar a página inicial de um software, o usuário não consegue perceber se a ferramenta serve para sua necessidade nem quais problemas ela resolve. Qual subcaracterística está mais relacionada?

**Alternativas:** Reconhecimento de adequação | Capacidade de aprendizado | Autodescrição | Envolvimento do usuário

**Gabarito:** Reconhecimento de adequação - O reconhecimento de adequação verifica se o usuário consegue perceber que o produto é apropriado para suas necessidades.

**A12. Capacidade de interação - Capacidade de aprendizado**

Funcionários novos precisam de três semanas de treinamento para executar tarefas básicas que deveriam ser aprendidas em poucas horas. Qual subcaracterística está em risco?

**Alternativas:** Capacidade de aprendizado | Operabilidade | Assistência ao usuário | Reconhecimento de adequação

**Gabarito:** Capacidade de aprendizado - A questão central é o tempo e esforço necessários para aprender a usar as funções, logo capacidade de aprendizado.

**A13. Capacidade de interação - Operabilidade**

O sistema usa atalhos de teclado diferentes em cada tela e os botões Salvar e Cancelar trocam de posição de uma tela para outra, o que torna o controle do sistema lento e incerto. Qual subcaracterística está mais comprometida?

**Alternativas:** Operabilidade | Envolvimento do usuário | Autodescrição | Completude funcional

**Gabarito:** Operabilidade - Operabilidade trata dos atributos que tornam o produto fácil de operar e controlar, como a consistência dos controles. Seria Autodescrição se a interface não explicasse o que cada controle faz; aqui os controles são conhecidos, mas inconsistentes.

**A14. Capacidade de interação - Proteção contra erros do usuário**

Um botão “Excluir todos os registros” é executado imediatamente, sem confirmação, validação ou possibilidade de desfazer. Qual subcaracterística deveria prevenir esse problema?

**Alternativas:** Proteção contra erros do usuário | Autodescrição | À prova de falhas | Integridade

**Gabarito:** Proteção contra erros do usuário - A interface deveria prevenir um erro operacional grave do usuário. Isso é proteção contra erros do usuário.

**A15. Capacidade de interação - Envolvimento do usuário**

O aplicativo é fácil de operar e não apresenta erros, mas tem telas cinzentas, sem identidade visual e sem nenhum elemento que torne o uso agradável. Pesquisas mostram baixa satisfação e muitos usuários deixam de voltar. Qual subcaracterística é mais pertinente?

**Alternativas:** Envolvimento do usuário | Operabilidade | Disponibilidade | Reconhecimento de adequação

**Gabarito:** Envolvimento do usuário - Envolvimento do usuário trata de apresentar funções e informações de forma convidativa e motivadora, que incentive o uso contínuo (a norma cita cores harmoniosas, interface intuitiva e voz amigável). Não é Operabilidade: o enunciado diz que o app é fácil de operar.

**A16. Capacidade de interação - Inclusão**

Uma plataforma internacional usa apenas exemplos, termos e fluxos compreensíveis para um único grupo cultural e idioma, apesar de seu público incluir pessoas de várias regiões e níveis de escolaridade. Qual subcaracterística está mais relacionada?

**Alternativas:** Inclusão | Assistência ao usuário | Capacidade de aprendizado | Reconhecimento de adequação

**Gabarito:** Inclusão - Inclusão considera pessoas de origens e perfis diversos: idades, habilidades, culturas, idiomas, educação e situações de vida. Assistência ao usuário trataria de recursos concretos para capacidades específicas, como leitor de tela; aqui o problema é o conteúdo pensado para um único grupo cultural.

**A17. Capacidade de interação - Assistência ao usuário**

Um serviço público digital não pode ser operado por teclado, não funciona com leitor de tela e não oferece meios alternativos de entrada para pessoas com limitações motoras. Qual subcaracterística está diretamente afetada?

**Alternativas:** Assistência ao usuário | Inclusão | Autodescrição | Operabilidade

**Gabarito:** Assistência ao usuário - Assistência ao usuário é a capacidade de o produto ser usado por pessoas com a mais ampla gama de capacidades; a norma diz que as regras de acessibilidade se aplicam a ela e cita deficiências de visão, audição e uso das mãos. Inclusão é mais ampla (atender públicos de idades, culturas, idiomas e perfis diversos); a falta de recursos concretos de acessibilidade, como teclado e leitor de tela, cai em Assistência ao usuário.

**A18. Capacidade de interação - Autodescrição**

A tela mostra apenas ícones sem rótulos, não informa o estado atual da operação e obriga o usuário a consultar o manual para descobrir o significado de ações básicas. Qual subcaracterística está comprometida?

**Alternativas:** Autodescrição | Reconhecimento de adequação | Envolvimento do usuário | Capacidade de aprendizado

**Gabarito:** Autodescrição - Autodescrição exige que a própria interface comunique informações suficientes sobre estado, possibilidades e uso.

**A19. Confiabilidade - Inexistência de falhas**

Durante a operação normal, sem sobrecarga ou incidentes externos, o aplicativo fecha inesperadamente várias vezes por dia. Qual subcaracterística está mais diretamente comprometida?

**Alternativas:** Inexistência de falhas | Disponibilidade | Tolerância a falhas | Recuperabilidade

**Gabarito:** Inexistência de falhas - A aplicação apresenta falhas em condições normais, o que se relaciona diretamente à inexistência de falhas.

**A20. Confiabilidade - Disponibilidade**

Um sistema hospitalar precisa estar acessível 24x7, mas fica indisponível por duas horas toda semana. Qual subcaracterística é a principal preocupação?

**Alternativas:** Disponibilidade | Inexistência de falhas | Capacidade | Tolerância a falhas

**Gabarito:** Disponibilidade - Disponibilidade verifica se o produto está operacional e acessível quando necessário.

**A21. Confiabilidade - Tolerância a falhas**

Um dos discos do servidor de banco de dados queima durante o expediente. O espelhamento assume na hora e o sistema continua registrando vendas normalmente, sem erros e sem perder as transações em andamento. Qual subcaracterística esse comportamento demonstra?

**Alternativas:** Tolerância a falhas | Recuperabilidade | Disponibilidade | À prova de falhas

**Gabarito:** Tolerância a falhas - O produto continuou operando como previsto apesar de uma falha de hardware: tolerância a falhas. Disponibilidade é o resultado medido ao longo do tempo (a norma a descreve como combinação de inexistência de falhas, tolerância a falhas e recuperabilidade). Recuperabilidade só entraria se o serviço tivesse parado e precisasse ser restaurado.

**A22. Confiabilidade - Recuperabilidade**

Após uma queda de energia, o sistema volta a ligar, mas os pedidos dos últimos 10 minutos somem e alguns registros ficam pela metade. O requisito exigia voltar ao último ponto consistente em até 5 minutos. Qual subcaracterística não foi atendida?

**Alternativas:** Recuperabilidade | Tolerância a falhas | Integridade | Inexistência de falhas

**Gabarito:** Recuperabilidade - Recuperabilidade avalia se, após uma interrupção, o produto recupera os dados afetados e restabelece o estado desejado. Tolerância a falhas seria continuar operando durante a falha, sem cair; aqui o sistema caiu e o problema está na volta.

**A23. Segurança da informação - Confidencialidade**

Usuários sem autorização conseguem visualizar prontuários médicos que deveriam ser restritos à equipe responsável. Qual subcaracterística foi violada?

**Alternativas:** Confidencialidade | Integridade | Autenticidade | Responsabilização

**Gabarito:** Confidencialidade - Confidencialidade garante que dados sejam acessíveis apenas a entidades autorizadas.

**A24. Segurança da informação - Integridade**

Um atacante altera silenciosamente o valor de transações armazenadas no banco de dados. Qual subcaracterística está diretamente comprometida?

**Alternativas:** Integridade | Confidencialidade | Não repúdio | Resistência

**Gabarito:** Integridade - Integridade protege dados e estado do sistema contra alteração ou exclusão não autorizada.

**A25. Segurança da informação - Não repúdio**

Uma empresa precisa provar posteriormente que uma determinada transação eletrônica foi realmente realizada, evitando que a parte responsável negue o evento. Qual subcaracterística é necessária?

**Alternativas:** Não repúdio | Responsabilização | Autenticidade | Integridade

**Gabarito:** Não repúdio - Não repúdio gera provas de que a transação ocorreu (por exemplo, assinatura digital ou recibo), para que ninguém possa negá-la depois. Responsabilização só rastreia qual entidade executou a ação; não produz, por si, prova contra a negação.

**A26. Segurança da informação - Responsabilização**

A auditoria precisa identificar de forma única qual conta executou cada alteração crítica no sistema. Qual subcaracterística atende melhor essa necessidade?

**Alternativas:** Responsabilização | Não repúdio | Autenticidade | Confidencialidade

**Gabarito:** Responsabilização - Responsabilização rastreia cada ação de forma única até a entidade que a executou (por exemplo, log por conta). Não repúdio vai além: produz prova de que o evento ocorreu, para que não possa ser negado.

**A27. Segurança da informação - Autenticidade**

Antes de liberar acesso administrativo, o sistema precisa comprovar que a identidade apresentada pertence realmente ao administrador alegado. Qual subcaracterística está em foco?

**Alternativas:** Autenticidade | Confidencialidade | Responsabilização | Resistência

**Gabarito:** Autenticidade - Autenticidade está relacionada a comprovar a identidade alegada de um sujeito ou recurso.

**A28. Segurança da informação - Resistência**

Durante um ataque de negação de serviço, o portal precisa continuar emitindo boletos para os clientes legítimos enquanto bloqueia o tráfego malicioso. Qual subcaracterística trata diretamente disso?

**Alternativas:** Resistência | Disponibilidade | Tolerância a falhas | Integridade

**Gabarito:** Resistência - Resistência é a capacidade de sustentar as operações enquanto o produto está sob ataque de um agente malicioso. Disponibilidade e Tolerância a falhas tratam de falhas em geral; o foco aqui é o ataque.

**A29. Manutenibilidade - Modularidade**

Uma pequena alteração no módulo de cadastro provoca mudanças obrigatórias em dezenas de módulos não relacionados. Qual subcaracterística precisa ser melhorada?

**Alternativas:** Modularidade | Modificabilidade | Capacidade de análise | Reutilização

**Gabarito:** Modularidade - Modularidade é a divisão em componentes que limita a propagação de mudanças. Modificabilidade é o resultado (mudar sem introduzir defeitos); aqui a causa apontada é o acoplamento entre módulos.

**A30. Manutenibilidade - Reutilização**

Uma equipe deseja utilizar o mesmo componente de autenticação, sem reescrevê-lo, em vários produtos diferentes da organização. Qual subcaracterística está sendo explorada?

**Alternativas:** Reutilização | Modularidade | Substituibilidade | Adaptabilidade

**Gabarito:** Reutilização - Reutilização avalia o uso de um ativo em mais de um sistema ou na construção de outros ativos.

**A31. Manutenibilidade - Capacidade de análise**

Quando ocorre um defeito, a equipe leva dias apenas para descobrir a causa e quais módulos serão afetados pela correção. Qual subcaracterística está mais comprometida?

**Alternativas:** Capacidade de análise | Testabilidade | Modificabilidade | Modularidade

**Gabarito:** Capacidade de análise - Capacidade de análise envolve diagnosticar causas, avaliar impactos e identificar as partes que precisam ser modificadas.

**A32. Manutenibilidade - Modificabilidade**

Toda correção aparentemente simples costuma introduzir novos defeitos em funcionalidades já estáveis. Qual subcaracterística está mais relacionada?

**Alternativas:** Modificabilidade | Testabilidade | Modularidade | Reutilização

**Gabarito:** Modificabilidade - Modificabilidade avalia se mudanças podem ser feitas sem introduzir defeitos nem degradar a qualidade. Modularidade explicaria o alcance da mudança entre módulos, e Testabilidade a dificuldade de testar; o sintoma descrito é a introdução de defeitos ao modificar.

**A33. Manutenibilidade - Testabilidade**

Depois de uma alteração no cálculo de frete, ninguém consegue comprovar que o resultado continua certo: não existem resultados esperados documentados e o componente só pode ser executado pela interface completa, em produção. Qual subcaracterística está comprometida?

**Alternativas:** Testabilidade | Capacidade de análise | Modificabilidade | Correção funcional

**Gabarito:** Testabilidade - Testabilidade é a facilidade de definir critérios de teste e executar testes que mostrem se foram atendidos. Capacidade de análise seria descobrir a causa de um defeito; aqui o problema é não ter como testar.

**A34. Flexibilidade - Adaptabilidade**

O produto foi desenvolvido para Linux, mas precisa ser transferido para outro ambiente operacional e hardware com mudanças mínimas. Qual subcaracterística está em foco?

**Alternativas:** Adaptabilidade | Instalabilidade | Substituibilidade | Coexistência

**Gabarito:** Adaptabilidade - Adaptabilidade trata da transferência ou adaptação eficaz para diferentes ambientes de hardware, software ou uso.

**A35. Flexibilidade - Escalabilidade**

Uma plataforma SaaS precisa ajustar sua capacidade conforme o número de clientes cresce de 5 mil para 500 mil e também reduzir recursos em períodos de baixa. Qual subcaracterística descreve melhor essa necessidade?

**Alternativas:** Escalabilidade | Capacidade | Adaptabilidade | Utilização de recursos

**Gabarito:** Escalabilidade - Escalabilidade trata da adaptação a cargas crescentes ou decrescentes e à variabilidade de capacidade.

**A36. Flexibilidade - Instalabilidade**

A implantação de uma nova versão exige dezenas de passos manuais, configurações frágeis e frequentemente falha durante a instalação. Qual subcaracterística deve ser melhorada?

**Alternativas:** Instalabilidade | Adaptabilidade | Modificabilidade | Operabilidade

**Gabarito:** Instalabilidade - Instalabilidade avalia a eficácia e eficiência para instalar e remover o produto no ambiente especificado.

**A37. Flexibilidade - Substituibilidade**

A prefeitura vai desligar o sistema de protocolo antigo e colocar no lugar o produto de outro fornecedor, no mesmo servidor e aproveitando os mesmos dados. Qual subcaracterística do novo produto é central para essa troca?

**Alternativas:** Substituibilidade | Interoperabilidade | Adaptabilidade | Reutilização

**Gabarito:** Substituibilidade - Substituibilidade avalia se um produto pode substituir outro com a mesma finalidade no mesmo ambiente. Adaptabilidade seria levar o mesmo produto para outro ambiente; aqui o ambiente é o mesmo e o produto muda.

**A38. Segurança operacional - Restrição operacional**

Uma máquina industrial detecta temperatura acima do limite e bloqueia automaticamente a continuidade da operação fora da faixa segura. Qual subcaracterística está sendo aplicada?

**Alternativas:** Restrição operacional | À prova de falhas | Aviso de perigo | Identificação de riscos

**Gabarito:** Restrição operacional - Restrição operacional mantém a operação dentro de parâmetros seguros diante de um perigo. Não houve falha de componente: o sensor funciona e o produto só impede a operação fora da faixa segura. Se um componente falhasse e o produto entrasse em modo seguro, seria À prova de falhas.

**A39. Segurança operacional - Identificação de riscos**

O sistema analisa a combinação de pressão, temperatura e sequência de comandos para reconhecer uma condição que pode causar explosão antes de ela ocorrer. Qual subcaracterística é essa?

**Alternativas:** Identificação de riscos | Aviso de perigo | Restrição operacional | Resistência

**Gabarito:** Identificação de riscos - Identificação de riscos detecta cursos de eventos ou operações que podem expor pessoas, bens ou ambiente a risco inaceitável.

**A40. Segurança operacional - À prova de falhas**

Se o sensor principal de um equipamento médico falhar, o software deve interromper a emissão e colocar o equipamento automaticamente em estado seguro. Qual subcaracterística descreve esse comportamento?

**Alternativas:** À prova de falhas | Tolerância a falhas | Recuperabilidade | Restrição operacional

**Gabarito:** À prova de falhas - À prova de falhas significa colocar-se automaticamente em modo ou condição segura quando ocorre uma falha. Tolerância a falhas manteria o equipamento operando normalmente apesar da falha; aqui o certo é interromper e ir para estado seguro.

**A41. Segurança operacional - Aviso de perigo**

Antes que a pressão atinja nível crítico, o sistema aciona alertas claros para que o operador tenha tempo suficiente de reagir e evitar um acidente. Qual subcaracterística está em foco?

**Alternativas:** Aviso de perigo | Identificação de riscos | À prova de falhas | Restrição operacional

**Gabarito:** Aviso de perigo - Aviso de perigo comunica riscos com antecedência suficiente para permitir reação segura.

**A42. Segurança operacional - Integração segura**

Após conectar um novo controlador de terceiros a uma linha automatizada, o conjunto precisa continuar respeitando todos os limites de segurança. Qual subcaracterística é mais diretamente relevante?

**Alternativas:** Integração segura | Interoperabilidade | Coexistência | À prova de falhas

**Gabarito:** Integração segura - Integração segura avalia a manutenção da segurança durante e após a integração com outros componentes.

## Apêndice B – Auditoria Final

A Auditoria Final reúne 9 casos integradores, um para cada característica do modelo. Em cada partida, 5 casos são sorteados.

**B1. Caso final**

Um marketplace entrega todas as funções corretas, mas durante uma promoção o tempo de resposta sobe para 25 segundos e a vazão (throughput) cai drasticamente. Qual característica deve ser priorizada?

**Alternativas:** Eficiência de desempenho | Adequação funcional | Manutenibilidade | Confiabilidade

**Gabarito:** Eficiência de desempenho - O sintoma medido é tempo de resposta e vazão fora do requisito: Eficiência de desempenho (comportamento no tempo). Confiabilidade trataria de falhas ou indisponibilidade; aqui o sistema funciona, só que lento.

**B2. Caso final**

O sistema consegue processar pedidos, mas não consegue trocar corretamente os dados de estoque com o ERP parceiro. Qual característica está mais diretamente envolvida?

**Alternativas:** Compatibilidade | Capacidade de interação | Manutenibilidade | Segurança operacional

**Gabarito:** Compatibilidade - A troca e uso de informações entre produtos é tema de compatibilidade, especialmente interoperabilidade.

**B3. Caso final**

Uma aplicação expõe relatórios sigilosos a usuários sem permissão e não registra de forma confiável quem acessou os dados. Qual característica está mais comprometida?

**Alternativas:** Segurança da informação | Confiabilidade | Adequação funcional | Flexibilidade

**Gabarito:** Segurança da informação - O caso envolve confidencialidade e responsabilização, ambas subcaracterísticas de Segurança da informação.

**B4. Caso final**

Uma alteração pequena em um módulo exige modificações em grande parte do sistema e os testes de regressão são difíceis de estruturar. Qual característica merece maior atenção?

**Alternativas:** Manutenibilidade | Eficiência de desempenho | Compatibilidade | Capacidade de interação

**Gabarito:** Manutenibilidade - Impacto de mudanças e dificuldade de testar são problemas de modularidade/testabilidade, dentro de manutenibilidade.

**B5. Caso final**

Um equipamento automatizado continua movimentando um braço mecânico mesmo após detectar falha crítica em um sensor, podendo ferir pessoas. Qual característica deve ser tratada imediatamente?

**Alternativas:** Segurança operacional | Confiabilidade | Segurança da informação | Adequação funcional

**Gabarito:** Segurança operacional - O problema envolve risco direto à vida e necessidade de condição segura diante de falha: Segurança operacional.

**B6. Caso final**

Usuários com deficiência visual não conseguem navegar pelo portal com leitor de tela e pessoas de diferentes perfis têm dificuldade de concluir tarefas básicas. Qual característica é central?

**Alternativas:** Capacidade de interação | Compatibilidade | Flexibilidade | Confiabilidade

**Gabarito:** Capacidade de interação - A questão envolve assistência ao usuário, inclusão e interação pela interface.

**B7. Caso final**

O sistema atende bem os 300 usuários atuais, com bom tempo de resposta, mas sua arquitetura não permite acrescentar servidores nem ajustar recursos conforme a demanda, que deve chegar a dezenas de milhares de usuários. Qual característica está mais relacionada?

**Alternativas:** Flexibilidade | Eficiência de desempenho | Adequação funcional | Segurança da informação

**Gabarito:** Flexibilidade - A necessidade é adaptar a capacidade a cargas crescentes ou variáveis: escalabilidade, subcaracterística de Flexibilidade na edição 2023. Eficiência de desempenho (Capacidade) mede se os limites atuais atendem ao requisito, e hoje atendem; o problema é não conseguir crescer.

**B8. Caso final**

Uma função exigida pelo negócio simplesmente não existe na nova versão do sistema. Qual característica está comprometida?

**Alternativas:** Adequação funcional | Confiabilidade | Compatibilidade | Segurança operacional

**Gabarito:** Adequação funcional - Falta de função requerida é um problema de completude funcional.

**B9. Caso final**

O serviço precisa operar 24x7, mas possui indisponibilidades frequentes e demora para restaurar o estado após falhas. Qual característica é central?

**Alternativas:** Confiabilidade | Eficiência de desempenho | Manutenibilidade | Segurança da informação

**Gabarito:** Confiabilidade - Disponibilidade e recuperabilidade pertencem à confiabilidade.
