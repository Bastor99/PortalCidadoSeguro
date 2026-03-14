async function register(){

  const username = (document.getElementById("user") || {}).value || '';
  const password = (document.getElementById("pass") || {}).value || '';
  const msg = document.getElementById("msg");

 if(msg) msg.innerText = '';

 if(!username || username.trim().length < 3){
    msg.innerText = "Usuário muito curto";
    return;
  }

  if(password.length < 6){
    msg.innerText = "Senha muito curta";
    return;
  }

   if(!validarSenha(password)){
    msg.innerText = "Senha deve conter pelo menos 1 letra maiúscula e 1 número.";
    return;
  }

  try{

    const response = await fetch("/api/register",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        username : username.trim(),
        password
      })
    });

    if(response.status === 201) {
        msg.innerText = "Cadastro realizado. Redirecionando para login..."
        setTimeout(() => { window.location.href = 'login.html'; }, 900);
        return;
    }

    const data = await response.json();

    if(!response.ok){
      msg.innerText = data.error;
      return;
    }

    msg.innerText = "Usuário cadastrado com sucesso!";

  }catch(err){

    msg.innerText = "Erro no cadastro";

  }

}