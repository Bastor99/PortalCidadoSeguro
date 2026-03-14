const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static("public"));


// garante diretório de logs
if(!fs.existsSync(path.join(__dirname, 'logs'))){
    fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
}
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

    console.log({
      event: "login_failed",
      username,
      ip,
      date: new Date()
    });

    return res.status(401).json({
      error: "Credenciais inválidas"
    });
  }

  if(user.role === "admin"){

    console.log({
      event: "mfa_required",
      username,
      ip,
      date: new Date()
    });

    return res.json({
      mfaRequired: true
    });
  }

  console.log({
    event: "login_success",
    username,
    ip,
    date: new Date()
  });

  res.json({
    username: user.username,
    role: user.role
  });

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

  console.log({ event: 'user_registered', username, ip, date: new Date() });
  fs.appendFileSync(path.join(__dirname, 'logs', 'access.log'), `[${new Date().toISOString()}] Registro: ${username} (${ip})\n`);

  return res.status(201).json({ username: newUser.username, role: newUser.role });

});