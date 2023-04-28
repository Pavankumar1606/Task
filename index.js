const express = require("express");
const fileupload = require("express-fileupload");
const { connect_db } = require("./db");
const { eventRouter } = require("./routes/event.router");
const app = express();

app.use(
    fileupload({
        limits: { fileSize: 100 * 1024 * 1024 },
    })
);
app.use(express.static("files"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

connect_db();

app.use('/api/v3/app', eventRouter);

app.get("/", (req, res) => { res.send("api working...") })

app.listen(5000, () => console.log("server is running..."))