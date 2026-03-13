export default function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, password } = req.body;

  const users = [
    { username: "cidadao", password: "123456", role: "user" },
    { username: "admin", password: "admin123", role: "admin" }
  ];

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  return res.json({
    username: user.username,
    role: user.role
  });

}