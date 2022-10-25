const http = require("http");
require('dotenv').config()
const express = require("express");
const conn = require("./utils/conn/mongoConn");
const { startJobs } = require("./jobs");

const app = express();
var cors = require('cors')
 
app.use(cors({origin:"*"}))
const session = require('express-session');
const sess = { 
  secret: 'keyboard cat',
  cookie: {}
};
startJobs();
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
        await conn.startConn();
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
res.end('<p>What</p>')
});

let server = http.createServer(app);
let port=process.env.MY_PORT||7000
server.listen(port, () => {
    console.log("Server running on " + server.address().port)
})
