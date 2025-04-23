const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>My Page</title>
        </head>
        <body>
          <h1>Hello world!</h1>
        </body>
      </html>
    `);
  });

app.use((req, res) => {
  res.status(404).send("Page not found - 404");
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});