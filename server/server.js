const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    app: 'Plan con IA',
    message: 'Backend funcionando correctamente'
  });
});

app.get('/api', (req, res) => {
  res.json({
    app: 'Plan con IA',
    status: 'online'
  });
});

app.listen(PORT, () => {
  console.log(`Plan con IA backend ejecutándose en el puerto ${PORT}`);
});
