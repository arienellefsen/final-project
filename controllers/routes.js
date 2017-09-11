const passport = require('passport');
var Place2 = require("./../models/Place2.js");
var nodemailer = require('nodemailer');

module.exports = function(app) {

    //Route login page
    app.get('/', ensureAuthenticated, function(req, res, next) {
        res.redirect('login.html');
        console.log('Log Status: ' + logStatus.logStatus);
    });

    app.get('/dashboard', ensureAuthenticated, function(req, res, next) {
        if (req.isAuthenticated()) {
            isLog = true;
            logStatus = {
                logStatus: isLog
            };
            res.render('dashboard', logStatus);
        }
    });

    app.get('/favorite-places', ensureAuthenticated, function(req, res, next) {
        //res.render('favorite');
        Place2.find({}).exec(function(err, doc) {

            let pacData = {
                pac: doc
            }

            if (err) {
                console.log(err);
            } else {
                console.log(doc);
                res.render('my-packs', { pacData });

            }
        });
    });

    app.get('/my-pacs', ensureAuthenticated, function(req, res, next) {
        res.render('my-packs');
    });

    app.get('/dash', ensureAuthenticated, function(req, res, next) {
        res.redirect('dash.html');
    });

    //Route account page
    app.get('/account', ensureAuthenticated, function(req, res, next) {
        let userId = req.user;

        console.log(userId._json);
        console.log(userId._json.gender);
        var email = userId._json.emails.length;

        for (var i = 0; i < email; i++) {
            console.log('Email: ' + userId._json.emails[i].value);
        }
        let emails = 'test';
        let images = userId._json.image.url;
        let name = req.user.displayName;
        let fullName = userId._json.displayName;

        let userData = {
            userId: userId,
            name: fullName,
            email: emails,
            image: images
        };
        console.log('email: ' + userData.email);
        console.log('images: ' + images);

        console.log('obj:' + userData.image);
        res.render('account', { userData });
    });

    app.get('/login', ensureAuthenticated, function(req, res, next) {
        res.render('login', { user: req.user });
    });

    // GET /auth/google
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  The first step in Google authentication will involve
    //   redirecting the user to google.com.  After authorization, Google
    //   will redirect the user back to this application at /auth/google/callback
    app.get('/auth/google', passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/plus.login',
            'https://www.googleapis.com/auth/plus.profile.emails.read'
        ]
    }));

    // GET /auth/google/callback
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  If authentication fails, the user will be redirected back to the
    //   login page.  Otherwise, the primary route function function will be called,
    //   which, in this example, will redirect the user to the home page.
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/dashboard',
            failureRedirect: '/'
        }));

    app.get('/logout', function(req, res, next) {
        req.logout();
        res.redirect('login.html');
    });

    //Route to send Email
    app.post('/send', function(req, res, next) {

        var query = Place2.findOne({ 'name': 'Nj Ymca State Alliance' });
        var email = req.body.email;
        console.log('email:' + email);

        // selecting the `name` and `occupation` fields
        query.select('lat long name address');

        // execute the query at a later time
        query.exec(function(err, map) {

            if (err) return handleError(err);

            console.log('data: ' + map);
            let mapData = {
                    lat: map.lat,
                    long: map.long,
                    name: map.name,
                    address: map.address
                }
                //Call function to send email
            sendMail(email, mapData);
        })

        function sendMail(email, mapData) {
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ariene.ellefsen@gmail.com',
                    pass: 'Aladim2017@'
                }
            });

            console.log('name map: ' + mapData.name);

            var mailOptions = {
                from: 'ariene.ellefsen@gmail.com',
                to: email,
                subject: 'You got a Pack!',
                html: '<h1>Someone just want to share with you some cool pack!</h1><br><h3>' + mapData.name + '</h3><p>' + mapData.address + '</p><br><a href="http://maps.googleapis.com/maps/api/staticmap?size=800x8000&markers=color:red|' + mapData.lat + ',' + mapData.long + '&sensor=false">Click here to open the map </a>'
            };

            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

        }





        res.redirect('/favorite-places');

    });

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('login.html');
    }

};