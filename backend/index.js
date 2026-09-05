import express from "express";
import cors from "cors";
import documentRouter from './routes/documentRouter.js';
import errorHandler from "./middleware/errorHandler.js";

const app = express();

const PORT = 3000;

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.use('/api/document', documentRouter);

app.get("/", (req, res) => {
  return res.json({ message : "Collaborative Editor API is running" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is listening at PORT : ${PORT}`);
});