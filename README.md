# Planner ENEM

Site estático em HTML, CSS e JavaScript puro, pronto para GitHub Pages.

## Arquivos

- `index.html`: estrutura da página.
- `styles.css`: aparência e responsividade.
- `app.js`: calendário, progresso, persistência local, importação/exportação e tarefas.
- `.nojekyll`: mantém o GitHub Pages em modo estático simples.

## Publicar no GitHub Pages

1. Envie `index.html`, `styles.css` e `app.js` para a raiz do repositório `ian-marchi/sofia_jornalinda`.
2. No GitHub, abra `Settings` > `Pages`.
3. Em `Build and deployment`, escolha `Deploy from a branch`.
4. Selecione a branch principal e a pasta `/root`.
5. Salve. O GitHub Pages vai publicar o `index.html` da raiz.

Os dados preenchidos no planner ficam salvos no navegador da pessoa usando `localStorage`.
