/* Toast helper */
function ensureToastContainer(){
  let c = document.querySelector('.toast-container');
  if(!c){
    c = document.createElement('div');
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
}


// =============================
// REGISTRO
// =============================

async function register(){

  const username = (document.getElementById('reg-user') || {}).value || '';
  const password = (document.getElementById('reg-pass') || {}).value || '';
  const passConfirm = (document.getElementById('reg-pass-confirm') || {}).value || '';
  const msg = document.getElementById('reg-msg');

  if(msg) msg.innerText = '';

  if(!username || username.trim().length < 3){
    showToast('error', 'Usuário inválido.');
    return;
  }

  if(password.length < 3){
    showToast('error', 'Senha muito curta.');
    return;
  }

  if(password !== passConfirm){
    showToast('error', 'Senhas não coincidem.');
    return;
  }

  try{
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password })
    });

    if(response.status === 201){
      showToast('success', 'Cadastro realizado. Redirecionando para login...');
      setTimeout(() => { window.location.href = 'login.html'; }, 900);
      return;
    }

    const data = await response.json();
    if(data && data.error){
      showToast('error', data.error);
      return;
    }

    showToast('error', 'Erro ao cadastrar.');

  } catch(e){
    showToast('error', 'Erro de conexão.');
  }

}

function showToast(type, message, duration = 3500){
  const container = ensureToastContainer();

  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-message">${message}</span>`;

  const close = document.createElement('span');
  close.className = 'toast-close';
  close.innerText = '×';
  close.onclick = () => { hideToast(t); };
  t.appendChild(close);

  container.appendChild(t);

  // force reflow to enable transition
  void t.offsetWidth;
  t.classList.add('show');

  const timeout = setTimeout(() => hideToast(t), duration);
  t._timeout = timeout;
}

function hideToast(el){
  if(!el) return;
  clearTimeout(el._timeout);
  el.classList.remove('show');
  setTimeout(() => { if(el.parentNode) el.parentNode.removeChild(el); }, 300);
}
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
    showToast('error', 'Usuário inválido.');
    return;
  }

  if(password.length < 3){
    msg.innerText = "Senha inválida.";
    showToast('error', 'Senha inválida.');
    return;
  }

  // validação de complexidade removida (apenas demo)

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
    // MFA (demo)
    // -------------------------
    if(data.mfaRequired){
      showToast('info', 'Digite o código MFA.');
      sessionStorage.setItem("mfaToken", data.mfaToken);
      window.location.href = "/mfa.html";
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
    showToast('success', 'Login realizado com sucesso.');
    // redireciona conforme o tipo (pequeno delay para mostrar toast)
    setTimeout(() => {
      if(data.role === "admin"){
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }
    }, 700);

  } catch(error){

    msg.innerText = "Usuário ou senha incorretos.";
    showToast('error', 'Usuário ou senha incorretos.');

  }

}