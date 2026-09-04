import express from "express";

const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  return res.json({ message : "Collaborative Editor API is running" });
});

app.get("/api/document", (req, res) => {
  return res.json({
    id: 1,
    title: "Untitled Document",
    content: ""
  });
});

app.listen(PORT, () => {
  console.log(`Server is listening at PORT : ${PORT}`);
});