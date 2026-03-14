const express = require("express");
const crypto = require("crypto");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const USERS_FILE = "users.json";


// =============================
// UTILITÁRIOS
// =============================

function hashPassword(password){
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

function sanitize(input){
  return input.replace(/[<>]/g,"");
}


// =============================
// LER USUÁRIOS
// =============================

function getUsers(){

  const data = fs.readFileSync(USERS_FILE);

  return JSON.parse(data);

}

function saveUsers(users){

  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify(users,null,2)
  );

}


// =============================
// CADASTRO
// =============================

app.post("/api/register",(req,res)=>{

  const username = sanitize(req.body.username || "");
  const password = sanitize(req.body.password || "");

  if(username.length < 3){

    return res.status(400).json({
      error:"Usuário inválido"
    });

  }

  if(password.length < 6){

    return res.status(400).json({
      error:"Senha muito curta"
    });

  }

  const users = getUsers();

  const exists = users.find(
    u => u.username === username
  );

  if(exists){

    return res.status(400).json({
      error:"Usuário já existe"
    });

  }

  users.push({
    username,
    password: hashPassword(password),
    role:"user"
  });

  saveUsers(users);

  res.json({
    success:true
  });

});


// =============================
// LOGIN
// =============================

app.post("/api/login",(req,res)=>{

  const username = sanitize(req.body.username || "");
  const password = sanitize(req.body.password || "");

  const hashed = hashPassword(password);

  const users = getUsers();

  const user = users.find(
    u => u.username === username &&
    u.password === hashed
  );

  if(!user){
    return res.status(401).json({
      error:"Credenciais inválidas"
    });

  }

  res.json({
    username:user.username,
    role:user.role
  });

});


// =============================
// SERVIDOR
// =============================

const PORT = 3000;

app.listen(PORT,()=>{
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});