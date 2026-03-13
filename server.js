const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const users = [
    {id: 1, username: "cidadao", password: "123456", role: "cidadao"},
    {id: 2, username: "admin", password: "admin123", role: "admin"}
];

function logAccess(message) {
    const log = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync("./logs/access.log", log);
}

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = users.find(
        u => u.username === username && u.password === password
    );

    if (!user) {
        logAccess(`Falha de login: ${username}`);
        return res.status(401).json({ error: "Credenciais inválidas." });
    }

    logAccess(`Login realizado: ${username}`);

    res.json({
        username: user.username,
        role: user.role
    });
});

app.get("/logs", (req, res) => {

  try {

    const data = fs.readFileSync("./logs/access.log", "utf8");

    const lines = data.split("\n").filter(l => l.trim() !== "");

    const logs = lines.map(line => {
      const parts = line.split("]");
      return {
        date: parts[0].replace("[",""),
        message: parts[1].trim()
      };
    });

    res.json(logs);

  } catch {
    res.json([]);
  }

});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
})