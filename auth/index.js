const router = require("express").Router();
const { mongoClient } = require("../utils/conn/mongoConn");
const waleprjDB = mongoClient.db("waleprj");
const usersCol = waleprjDB.collection("users")
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require("bcrypt")

passport.use(new LocalStrategy(
    function (username, password, done) {
        usersCol.findOne({ username: username }, function (err, user) {
            console.log("uyftyf");
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            bcrypt.compare(password, user.hash, function (err, result) {
                if (err) {
                    return done(null, false, { message: 'Password verification fails.' });
                }
                if (!result) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            });
        });
    }
));

router.use("/local", (req, res, next) => {
    passport.authenticate('local', function (err, user, info) {
        if (err) { return next(err); }
        if (!user) {
            res.status(401);
            return res.json({ err: info });
        }
        req.logIn(user, function (err) {
            if (err) { return next(err); }
            res.status(200);
            next()
        });
    })(req, res, next);
});


module.exports = router;