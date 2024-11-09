const express = require('express');
const app = express();
const port = 5001; 

const contestsRouter = require('./index');
app.use('/api', contestsRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});