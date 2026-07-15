require('dotenv').config();

const { createApp } = require('./src/app');

const port = process.env.PORT || 4000;
const app = createApp();

app.listen(port, function () {
  console.log(`OMS backend listening on http://localhost:${port}`);
});
