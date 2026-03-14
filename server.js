const express = require("express");
const crypto = require("crypto");

const app = express();

app.use(express.json());
app.use(express.static("public"));


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