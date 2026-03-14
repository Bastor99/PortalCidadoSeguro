async function register(){

  const username = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value.trim();
  const msg = document.getElementById("msg");

  msg.innerText = "";

  if(username.length < 3){
    msg.innerText = "Usuário muito curto";
    return;
  }

  if(password.length < 6){
    msg.innerText = "Senha muito curta";
    return;
  }

  try{

    const response = await fetch("/api/register",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        username,
        password
      })
    });

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