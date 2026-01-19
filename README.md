# Meu Site (local)

Instruções rápidas para visualizar o site localmente.

Opção 1 — servidor Python (recomendado):

```powershell
cd C:\site\meu-site
py -3 -m http.server 8000
```

ou

```powershell
cd C:\site\meu-site
python -m http.server 8000
```

Depois abra: `http://localhost:8000`

Opção 2 — usando npx (Node.js):

```powershell
cd C:\site\meu-site
npx http-server -p 8000
```

Por que usar um servidor?
- Navegadores bloqueiam `fetch()` quando a página é aberta via `file://` por motivos de segurança. Servir via `http://localhost` permite que o `fetch('projects.json')` funcione normalmente.

Fallback embutido:
- Já embutimos `projects.json` em `index.html` (tag `#projects-data`) para que a página também funcione se você abrir pelo explorador (file://).