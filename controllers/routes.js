const passport = require('passport');
var Place2 = require("./../models/Place2.js");
var nodemailer = require('nodemailer');
var User = require("./../models/User.js");

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
        var emailAddress = "";
        var emailcnt = req.user._json.emails.length;
        if (emailcnt > 0)
            emailAddress = req.user._json.emails[0].value;

        User.findOne({
                emailAddress: emailAddress
            }) // ..and populate all of the pacs for the user
            .populate({
                path: "pacs",
                populate: {
                    path: 'places'
                },
                options: {
                    sort: [{
                        "createdAt": -1
                    }]
                }
            }).exec(function(error, existinguser) {
                if (error) {
                    console.log(error);
                } else {
                    if (!existinguser) { //cannot use existinguser.length===0 for findOne function
                        var doc = [];
                        let pacData = {
                            pac: doc
                        }
                        res.render('my-packs', {
                            pacData
                        });
                    } else {
                        console.log(JSON.stringify(existinguser));
                        let pacData = {
                            pac: existinguser.pacs
                        }
                        res.render('my-packs', {
                            pacData
                        });
                    }
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
        var emailAddress = "";
        var emailcnt = req.user._json.emails.length;
        if (emailcnt > 0)
            emailAddress = req.user._json.emails[0].value;

        User.findOne({
                emailAddress: emailAddress
            })
            .exec(function(error, userwpacs) {
                // Log any errors
                if (error) {
                    console.log(error);
                }
                // Otherwise, send the doc to the browser as a json object
                else {
                    console.log(JSON.stringify(userwpacs));
                    let userData = {
                        userId: userwpacs._id,
                        name: userwpacs.firstName + userwpacs.lastName,
                        firstname: userwpacs.firstName,
                        lastname: userwpacs.lastName,
                        email: userwpacs.emailAddress,
                        image: req.user._json.image
                    };
                    res.render('account', {
                        userData
                    });
                }
            });
    });

    app.get('/login', ensureAuthenticated, function(req, res, next) {
        res.render('login', {
            user: req.user
        });
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

        var query = Place2.findOne({
            'name': 'Nj Ymca State Alliance'
        });
        var email = req.body.email;
        console.log('email:' + email);

        // selecting the `name` and `occupation` fields
        query.select('lat long name address');

        // execute the query at a later time
        query.exec(function(err, map) {

            if (err) return handleError(err);

            console.log('data: ' + map);
            let mapData = {
                lat: 'lat',
                long: 'long',
                name: 'name',
                address: 'address'
            }
            //Call function to send email
            sendMail(email, mapData);
        })

        function sendMail(email, mapData) {
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'xiaoyingwen@gmail.com',
                    pass: 'f*m5p&haL'
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
        if (req.isAuthenticated()) {
            //check existing user or not
            //Register new user
            console.log("to check pacappuserid: " + req.user.pacappuserid);
            if (!req.user.pacappuserid) {
                setPacUserId(req);
            }
            return next();
        }
        res.redirect('login.html');
    }

    function getPacUserInfoFromGmailAcct(userGmailAcctInfo) {
        var emailAddress = "";

        var emailcnt = userGmailAcctInfo.emails.length;
        if (emailcnt > 0)
            emailAddress = userGmailAcctInfo.emails[0].value;

        var pacUser = {
            firstName: userGmailAcctInfo.name.givenName ? userGmailAcctInfo.name.givenName : "FristName",
            lastName: userGmailAcctInfo.name.familyName ? userGmailAcctInfo.name.familyName : "LastName",
            emailAddress: emailAddress
        };

        return pacUser;
    }

    function setPacUserId(req) {
        var pacUser = getPacUserInfoFromGmailAcct(req.user._json);
        console.log(pacUser);

        User.findOne({
                emailAddress: pacUser.emailAddress
            }) 
            .exec(function(error, existinguser) {
                if (error) {
                    console.log(error);
                } else {
                    if (!existinguser) { //cannot use existinguser.length===0 for findOne function
                        //save the User
                        // Using our User model, create a new entry
                        // This effectively passes the result object to the entry
                        var entry = new User(pacUser);

                        // Now, save that entry to the db
                        entry.save(function(err, newuser) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(JSON.stringify(newuser));
                                req.user.pacappuserid = newuser._id;
                                console.log("after set pacappuserid: " + req.user.pacappuserid);
                            }
                        });
                    } else {
                        console.log(JSON.stringify(existinguser));
                        req.user.pacappuserid = existinguser._id;
                        console.log("after set pacappuserid: " + req.user.pacappuserid);
                    }
                }
            });
    }

};