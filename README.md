# Portal Cidadão Seguro

> Aplicação demo de um portal municipal com autenticação simples, painel de usuário e painel administrativo.

## Visão geral

Projeto simples em Node.js + Express que serve arquivos estáticos em `public/` e fornece duas rotas principais no servidor:

- `POST /login` — endpoint de autenticação (consome JSON com `username` e `password`).
- `GET /logs` — retorna os logs de acesso gravados em `./logs/access.log` (usado pelo painel admin).

O frontend é composto por páginas estáticas em `public/`: `index.html`, `login.html`, `dashboard.html` e `admin.html`.

## Usuários de exemplo

- Usuário cidadão: `cidadao` / `123456` (role: `cidadao` / `user`)
- Usuário administrador: `admin` / `admin123` (role: `admin`)

> Observação: as credenciais estão codificadas no servidor apenas para demonstração.

## Requisitos

- Node.js (recomenda-se versão 14+)
- Pacotes listados em `package.json` (apenas `express` neste projeto)

## Instalação e execução

1. Instale dependências:

```
npm install
```

2. Execute o servidor:

```
node server.js
```

3. Acesse em `http://localhost:3000/`.

## Estrutura do projeto

- `server.js` — servidor Express que serve `public/`, fornece `/login` e `/logs` e grava logs em `./logs/access.log`.
- `api/login.js` — handler adicional (modo demo / alternativo) para requisições POST a `/api/login` usada pelo frontend.
- `public/` — arquivos estáticos do frontend (`index.html`, `login.html`, `dashboard.html`, `admin.html`, `script.js`, `style.css`).
- `package.json` — dependências e metadados do projeto.

## Endpoints importantes

- `POST /login` — corpo JSON: `{ "username": "...", "password": "..." }`. Resposta: `{ username, role }` (200) ou 401.
- `POST /api/login` — endpoint usado pelo `script.js` do frontend; comportamento similar ao `/login` interno.
- `GET /logs` — retorna array JSON com objetos `{ date, message }`. Se não houver logs retorna `[]`.

## Observações de desenvolvimento

- Logs: o servidor usa `./logs/access.log`. Assegure que a pasta `logs/` exista e tenha permissões de escrita antes de rodar o servidor.
- Autenticação: atualmente é apenas comparações em memória para demonstração. Não use em produção.
- Rotas e proteção: `admin.html` verifica `localStorage.role === 'admin'` no navegador; isso não é seguro para controle de autorização real.

## Melhorias sugeridas

- Persistir usuários e sessões em banco de dados.
- Implementar hash de senhas (bcrypt) e autenticação baseada em tokens (JWT).
- Proteger rotas sensíveis no servidor (verificar role no backend) e não confiar apenas em `localStorage`.
- Adicionar tratamento e rotação de logs, e endpoints paginados para visualização.

## Licença

Este repositório é um exemplo educacional. Adicione uma licença apropriada se for publicar.