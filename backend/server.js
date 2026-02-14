const express = require('express');

const app = express();
const port = process.env.PORT || 5001;

const contestsRouter = require('./index');

app.use(express.json());
app.use('/api', contestsRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
