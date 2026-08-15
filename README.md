# llmeme

Chat que responde con mensajes cortos + sticker final, usando la API de Claude con tool use forzado.

## 1. Antes de correr: pon tus stickers

Copia tus 10 imágenes/gifs dentro de `public/stickers/` con **exactamente** estos nombres
(ya están mapeados en `stickers.json` y en el `enum` del server):

```
cabeza_moribunda.png
gato_jefazo.png
sapo_asustado.png
hormiga_triste.png
paloma_triste.gif
perro_sospechoso.png
oso_bailando.gif
gato_beso.gif
perrito_gordito_echado.gif
apuntando_camara.png
```

Si tus archivos tienen otra extensión (jpg, webp, etc.) solo edita el campo `"file"` correspondiente en `stickers.json`.

## 2. Correr local

```bash
npm install
cp .env.example .env
# Edita .env y pon tu ANTHROPIC_API_KEY real
npm start
```

Abre `http://localhost:3000`.

## 3. Deploy en Railway

1. Sube este proyecto a un repo de GitHub (asegúrate que `.env` esté en `.gitignore`, ya lo está).
2. Entra a [railway.app](https://railway.app) → "New Project" → "Deploy from GitHub repo" → selecciona tu repo.
3. En la pestaña **Variables** del servicio, agrega:
   - `ANTHROPIC_API_KEY` = tu API key real
4. Railway detecta el `package.json` y corre `npm start` automáticamente.
5. En **Settings → Networking**, genera un dominio público (botón "Generate Domain").
6. Abre esa URL — ya está tu llmeme en vivo.

## Notas

- El historial de chat se guarda en memoria del servidor por `sessionId` (se genera random en el navegador). Si Railway reinicia el servicio, se pierde — normal para una demo.
- El `tool_choice` está forzado a `responder_con_sticker`, así que el modelo **siempre** devuelve JSON estructurado con mensajes + sticker válido (nunca texto libre suelto).
- Si la llamada a la API falla por cualquier razón, el server igual responde con un sticker de fallback en vez de romperse — así nunca "contestas algo que no sea meme/sticker" frente al jurado.
