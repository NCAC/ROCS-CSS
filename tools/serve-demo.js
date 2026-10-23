import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const demoDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../examples/RoasterLanding"
);
const port = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.static(demoDir));

app.listen(port, () => {
  console.log(`RoasterLanding : http://localhost:${port}`);
});
