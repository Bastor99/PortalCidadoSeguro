// =============================
// CONFIGURAÇÕES
// =============================

const SESSION_TIME = 3600000; // 1 hora


// =============================
// VALIDAÇÃO DE SENHA
// =============================

function validarSenha(password){
  const regex = /^(?=.*[A-Z])(?=.*[0-9]).{6,}$/;
  return regex.test(password);
}


// =============================
// CONTROLE DE SESSÃO
// =============================

function verificarSessao(){

  const loginTime = localStorage.getItem("loginTime");

  if(!loginTime){
    window.location.href = "login.html";
    return;
  }

  const diff = Date.now() - loginTime;

  if(diff > SESSION_TIME){
    logout();
  }

}


// =============================
// LOGOUT
// =============================

function logout(){

  localStorage.removeItem("role");
  localStorage.removeItem("username");
  localStorage.removeItem("loginTime");

  window.location.href = "login.html";

}


// =============================
// LOGIN
// =============================

async function login() {

  const username = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value.trim();
  const msg = document.getElementById("msg");

  msg.innerText = "";

  // -------------------------
  // validação básica
  // -------------------------

  if(username.length < 3){
    msg.innerText = "Usuário inválido.";
    return;
  }

  if(password.length < 3){
    msg.innerText = "Senha inválida.";
    return;
  }

  if(!validarSenha(password)){
    msg.innerText = "Senha deve conter número e letra maiúscula.";
    return;
  }

  try {

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    if(!response.ok){
      throw new Error("Falha no login");
    }

    const data = await response.json();

    // -------------------------
    // MFA
    // -------------------------

    if(data.mfaRequired){
      localStorage.setItem("username", username);
      window.location.href = "mfa.html";
      return;
    }

    // -------------------------
    // criar sessão
    // -------------------------

    localStorage.setItem("username", data.username);
    localStorage.setItem("role", data.role);
    localStorage.setItem("loginTime", Date.now());

    // -------------------------
    // redirecionamento
    // -------------------------

    if(data.role === "admin"){
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch(error){

    msg.innerText = "Usuário ou senha incorretos.";

  }

}