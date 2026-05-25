# Planner ENEM

Planner ENEM em duas versões no mesmo repositório:

- Site estático em HTML, CSS e JavaScript puro, pronto para GitHub Pages.
- Aplicação Expo Go em React Native, usando a mesma lógica de planner.

## Arquivos

- `index.html`: estrutura da página.
- `styles.css`: aparência e responsividade.
- `app.js`: calendário, progresso, persistência local, importação/exportação e tarefas.
- `index.js`: entrada da aplicação Expo.
- `src/`: telas, dados e tema da aplicação Expo Go.
- `app.json`, `package.json`, `babel.config.js`: configuração Expo.
- `.nojekyll`: mantém o GitHub Pages em modo estático simples.

## Publicar no GitHub Pages

1. Envie `index.html`, `styles.css` e `app.js` para a raiz do repositório `ian-marchi/sofia_jornalinda`.
2. No GitHub, abra `Settings` > `Pages`.
3. Em `Build and deployment`, escolha `Deploy from a branch`.
4. Selecione a branch principal e a pasta `/root`.
5. Salve. O GitHub Pages vai publicar o `index.html` da raiz.

Os dados preenchidos no planner ficam salvos no navegador da pessoa usando `localStorage`.

## Usar no Expo Go

Na raiz do projeto:

```bash
npm install
npm run start
```

Depois escaneie o QR Code com o Expo Go no celular.

Também há atalhos:

```bash
npm run android
npm run ios
```

No app mobile, os dados ficam salvos no dispositivo usando AsyncStorage. A seção "Backup" permite exportar os dados pelo compartilhamento do celular ou importar um JSON exportado.
