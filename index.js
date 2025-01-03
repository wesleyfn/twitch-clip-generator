require("dotenv").config();
const express = require("express");
const axios = require("axios");
const querystring = require("querystring");

const app = express();
const port = process.env.PORT || 3000;

let accessToken = "";

// Obter Access Token de Usuário
const getUserAccessToken = async (code) => {
  try {
    const response = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      querystring.stringify({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: process.env.TWITCH_REDIRECT_URI,
      })
    );
    accessToken = response.data.access_token;
    console.log("User access token obtido com sucesso!");
    console.log("User access token:", accessToken);
  } catch (error) {
    console.error("Erro ao obter o user access token:", error.response.data);
  }
};

// Redirecionar para a página de autorização do Twitch
app.get("/auth", (req, res) => {
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${process.env.TWITCH_REDIRECT_URI}&response_type=code&scope=clips:edit`;
  res.redirect(authUrl);
});

// Callback de autorização do Twitch
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  console.log("Código de autorização:", code);
  await getUserAccessToken(code);
  res.json({ message: "User access token obtido com sucesso! Verifique o console." });
});

// Home
app.get("/", (req, res) => {
  res.json({ message: "API rodando!" });
});

// Criar Clipe
app.get("/create-clip", async (req, res) => {
  const { broadcaster_id } = req.query;

  try {
    const response = await axios.post(
      `https://api.twitch.tv/helix/clips`,
      null,
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          broadcaster_id: broadcaster_id,
        },
      }
    );

    const clipData = response.data.data[0]; // Primeiro clipe criado

    // Enviar o link do clipe criado
    res.send(`https://clips.twitch.tv/${clipData.id}`);
  } catch (error) {
    console.error("Erro ao criar o clipe:", error.response.data);
    res.json(error.response.data);
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});