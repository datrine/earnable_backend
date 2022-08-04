const http = require("http");
require('dotenv').config()
const express = require("express");
const conn = require("./utils/conn/mongoConn");

const app = express();

const session = require('express-session');
const sess = { 
  secret: 'keyboard cat',
  cookie: {}
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}

app.use(session({ ...sess, saveUninitialized: true }));
const fileUpload = require('express-fileupload');

//app.use(formData.parse());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(fileUpload());
//app.use(require('express-body'));

(async () => {
    try {
        await conn.startConn()
        const { startAllStreams } = require("./admin/db_actions/monitors");
        startAllStreams();
       // const { jobFindAllSubscriptions } = require("./admin/bills/prepareBills");
        const apiRouter = require("./routes/api/");
        const serviceAPIRouter = require("./routes/services");
        app.use("/api/", apiRouter);
        app.use("/services/", serviceAPIRouter);
    } catch (error) {
        console.log(error)
    }
})()

app.get("/", (req, res, next) => {

});

let server = http.createServer(app);
server.listen(7000, () => {
    console.log("Server running on " + server.address().port)
})
