require("dotenv").config();
require("dotenv").config();
const express = require("express");
const { connection } = require("./config/db");
const app = express();
const path = require("path");
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.status(200).send("welcome to home page");
});
app.use(express.static("public"));
app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");

app.use("/api/files", require("./routes/file"));

app.use("/files", require("./routes/show"));
app.use("/files/download", require("./routes/download"));

app.listen(process.env.port, async () => {
    try {
        await connection;
        console.log("Connected to DataBase");
    } catch (error) {
        console.log("Couldn't connect to DataBase");
    }
    console.log(`Server running on port ${process.env.port}`);
});
