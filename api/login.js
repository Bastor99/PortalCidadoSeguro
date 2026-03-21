import crypto from "crypto";
import jwt from "jsonwebtoken";
const JWT_SECRET = "SEGREDO_SECRETO"


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
// CONTROLE DE RATE LIMIT
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
// BASE DE USUÁRIOS (SIMULADA)
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
// HANDLER DA API
// =============================

export default function handler(req, res) {

  // aceita apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  const ip = req.headers["x-forwarded-for"] || "unknown";

  // rate limit
  if(!checkRateLimit(ip)){
    return res.status(429).json({
      error: "Muitas tentativas de login."
    });
  }

  // sanitização de entrada
  const username = sanitize(req.body.username || "");
  const password = sanitize(req.body.password || "");

  // hash da senha recebida
  const hashedPassword = hashPassword(password);

  // busca usuário
  const user = users.find(
    u => u.username === username && u.password === hashedPassword
  );

  // usuário inválido
  if (!user) {

    console.log(JSON.stringify({
      event: "login_failed",
      username,
      ip,
      date: new Date()
    }));

    return res.status(401).json({
      error: "Credenciais inválidas"
    });
  }

  // MFA para admin
  if(user.role === "admin"){

    const mfaToken = jwt.sign(
      {
        username: user.username,
        mfa: true
      },
      JWT_SECRET,
      { expiresIn: "5m" }
    );

    console.log(JSON.stringify({
      event: "mfa_required",
      username,
      ip,
      date: new Date()
    }));

    return res.status(200).json({
      mfaRequired: true,
      mfaToken
    });
  }

  // login bem sucedido
  console.log(JSON.stringify({
    event: "login_success",
    username,
    ip,
    date: new Date()
  }));

  return res.status(200).json({
    username: user.username,
    role: user.role
  });

}