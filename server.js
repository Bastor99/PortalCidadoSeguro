const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "SEGREDO_SECRETO"

const app = express();

app.use(express.json());
app.use(express.static("public"));


// garante diretório de logs
if(!fs.existsSync(path.join(__dirname, 'logs'))){
    fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
}

// =============================
// LOGS(FUNÇÃO)
// =============================

function salvarLog(mensagem){

  const logPath = path.join(__dirname, "logs", "logs.json");

  let logs = [];

  if(fs.existsSync(logPath)){
    logs = JSON.parse(fs.readFileSync(logPath, "utf-8"));
  }

  logs.push({
    date: new Date().toLocaleString(),
    message: mensagem
  });

  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

// =============================
// LOGS
// =============================

app.get("/logs", (req, res) => {

  const authHeader = req.headers.authorization;

  if(!authHeader){
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(token, JWT_SECRET);

    if(decoded.role !== "admin"){
      return res.status(403).json({ error: "Acesso negado" });
    }

    const logPath = path.join(__dirname, "logs", "logs.json");

    if(!fs.existsSync(logPath)){
      return res.json([]);
    }

    const data = fs.readFileSync(logPath, "utf-8");

    const logs = JSON.parse(data);

    return res.json(logs);

  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
});

// =============================
// LOGS EVENTOS
// =============================

app.post("/api/log-event", (req, res) => {

  const authHeader = req.headers.authorization;
  let username = "anon";
  let role = "guest";

  // tenta identificar usuário via token
  if(authHeader){
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      username = decoded.username;
      role = decoded.role;

    } catch {
      // token inválido → continua como anon
    }
  }

  const { action } = req.body;

  if(!action){
    return res.status(400).json({ error: "Ação não informada" });
  }

  salvarLog(`[${role}] ${username}: ${action}`);

  res.json({ success: true });
});

// =============================
// UTILITÁRIOS
// =============================

// hash de senha
function hashPassword(password){
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

// sanitização básica
function sanitize(input){
  return input.replace(/[<>]/g, "");
}


// =============================
// RATE LIMIT
// =============================

const attempts = {};

function checkRateLimit(ip){

  if(!attempts[ip]){
    attempts[ip] = 1;
    return true;
  }

  attempts[ip]++;

  if(attempts[ip] > 5){
    return false;
  }

  return true;
}


// =============================
// BASE DE USUÁRIOS
// =============================

const users = [
  {
    username: "admin",
    password: hashPassword("admin123"),
    role: "admin"
  },
  {
    username: "cidadao",
    password: hashPassword("123456"),
    role: "user"
  }
];


// =============================
// ROTA DE LOGIN
// =============================

app.post("/api/login", (req, res) => {

  const ip = req.ip;

  if(!checkRateLimit(ip)){
    return res.status(429).json({
      error: "Muitas tentativas de login."
    });
  }

  const username = sanitize(req.body.username || "");
  const password = sanitize(req.body.password || "");

  const hashedPassword = hashPassword(password);

  const user = users.find(
    u => u.username === username && u.password === hashedPassword
  );

  if(!user){

    salvarLog(`Login falhou: ${username} (${ip})`);

    return res.status(401).json({
      error: "Credenciais inválidas"
    });
  }

  if(user.role === "admin"){

    const mfaToken = jwt.sign(
      {
        username: user.username,
        mfa: true
      },
      JWT_SECRET,
      { expiresIn: "5m" }
    );

    salvarLog(`MFA requerido: ${username}`);

    return res.json({
      mfaRequired: true,
      mfaToken
    });
  }

    salvarLog(`Login sucesso: ${username} (${ip})`);

  res.json({
    username: user.username,
    role: user.role
  });

});

// =============================
// ROTA DE AUTENTICAÇÃO MFA
// =============================

app.post("/api/verify-mfa", (req, res) => {

  const { code, mfaToken } = req.body;

  if(!mfaToken){
    return res.status(401).json({
      error: "Token MFA não fornecido"
    });
  }

  try {

    const decoded = jwt.verify(mfaToken, JWT_SECRET);

    // 🔐 garante que é token de MFA
    if(!decoded.mfa){
      return res.status(401).json({
        error: "Token inválido"
      });
    }

    // 🔢 DEMO (trocar por TOTP depois)
    if(code !== "123456"){
      return res.status(401).json({
        error: "Código inválido"
      });
    }

    // ✅ sucesso → login finalizado
    salvarLog(`MFA sucesso: ${decoded.username}`);

    const authToken = jwt.sign(
      {
        username: decoded.username,
        role: "admin"
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      authToken
    });

  } catch (err) {

    return res.status(401).json({
      error: "Token inválido ou expirado"
    });
  }
});

// =============================
// SERVIDOR
// =============================

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});


// =============================
// ROTA DE REGISTRO
// =============================

app.post('/api/register', (req, res) => {

  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  if(!checkRateLimit(ip)){
    return res.status(429).json({ error: 'Muitas tentativas. Tente mais tarde.' });
  }

  const username = sanitize(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if(!username || !password || password.length < 3){
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  // verifica existência
  if(users.some(u => u.username === username)){
    return res.status(409).json({ error: 'Usuário já existe.' });
  }

  const hashed = hashPassword(password);

  const newUser = { username, password: hashed, role: 'user' };
  users.push(newUser);

  salvarLog(`Registro: ${username} (${ip})`);
  fs.appendFileSync(path.join(__dirname, 'logs', 'access.log'), `[${new Date().toISOString()}] Registro: ${username} (${ip})\n`);

  return res.status(201).json({ username: newUser.username, role: newUser.role });

});