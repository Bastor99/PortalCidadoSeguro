async function login() {
    const username = document.getElementById("user").value.trim();
    const password = document.getElementById("pass").value.trim();

    if (username.length < 3 || password.length < 6){
        document.getElementById("msg").innerText = "Usuário ou senha inválidos.";
        return;
    }

    try {

        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ username, password})
        });

        if (!response.ok) {
            throw new Error();
        }

        const data = await response.json();

        localStorage.setItem("role", data.role);

        if (data.role === "admin") {
            window.location = "admin.html";
        } else {
            window.location = "dashboard.html";
        }
    } catch {
        document.getElementById("msg").innerText = "Usuário ou senha inválidos.";
    }
}