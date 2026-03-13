async function login() {

  const username = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value.trim();
  const msg = document.getElementById("msg");

  msg.innerText = "";

  // validação básica
  if(username.length < 3){
    msg.innerText = "Usuário inválido.";
    return;
  }

  if(password.length < 3){
    msg.innerText = "Senha inválida.";
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

    // redireciona conforme o tipo
    if(data.role === "admin"){
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch(error){

    msg.innerText = "Usuário ou senha incorretos.";

  }

}