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

async function login() {

  const username = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value.trim();
  const msg = document.getElementById("msg");

  msg.innerText = "";

  // validação básica
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

    // salva informações do usuário
    localStorage.setItem("username", data.username);
    localStorage.setItem("role", data.role);

    showToast('success', 'Login realizado com sucesso.');

    // redireciona conforme o tipo
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