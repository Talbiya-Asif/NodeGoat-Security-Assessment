"use strict";

const csrf = require("csurf");
const cors = require("cors");
const { generalLimiter, authLimiter, corsOptions, helmetConfig } = require("./middleware/security");
const express = require("express");
const favicon = require("serve-favicon");
const bodyParser = require("body-parser");
const session = require("express-session");
const consolidate = require("consolidate");
const swig = require("swig");
const MongoClient = require("mongodb").MongoClient;
const http = require("http");
const marked = require("marked");
const app = express();
const routes = require("./app/routes");
const { port, db, cookieSecret } = require("./config/config");


MongoClient.connect(db, (err, client) => {
    if (err) {
        console.log("Error: DB: connect");
        console.log(err);
        process.exit(1);
    }
    const db = client.db("nodegoat");
    console.log(`Connected to the database`);

    app.use(helmetConfig);
    app.disable("x-powered-by");
    app.use((req, res, next) => {
        res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()");
        next();
    });
    app.use(cors(corsOptions));
    app.use(generalLimiter);
    app.use("/login", authLimiter);

    app.use(favicon(__dirname + "/app/assets/favicon.ico"));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));

    app.use(session({
        secret: cookieSecret,
        saveUninitialized: false,
        resave: false,
        cookie: {
            httpOnly: true,
            secure: false, // set to true in production with HTTPS
            sameSite: "strict"
        }
   }));

    app.use(csrf());
    app.use((req, res, next) => {
        if (req.csrfToken) {
            res.locals.csrfToken = req.csrfToken();
            res.locals.csrftoken = req.csrfToken();
            res.locals._csrf = req.csrfToken();
       }
       next();
    });

    app.engine(".html", consolidate.swig);
    app.set("view engine", "html");
    app.set("views", `${__dirname}/app/views`);
    app.use(express.static(`${__dirname}/app/assets`));

    marked.setOptions({
        sanitize: true
    });
    app.locals.marked = marked;

    routes(app, db);

    swig.setDefaults({
        autoescape: false
    });

    http.createServer(app).listen(port, () => {
        console.log(`Express http server listening on port ${port}`);
    });

});