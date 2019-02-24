/*jshint esversion: 6 */
const path = require('path');
const express = require('express');
const app = express();
const crypto = require('crypto');

const session = require('express-session');
app.use(session({
    secret: 'CSCC09A3',
    resave: false,
    saveUninitialized: true,
}));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('frontend'));

var Datastore = require('nedb');
var comments = new Datastore({ filename: 'db/comments.db', autoload: true, timestampData : true});
var images = new Datastore({ filename: 'db/images.db', autoload: true, timestampData : true});
var users = new Datastore({ filename: 'db/users.db', autoload: true });

var multer  = require('multer');
var upload = multer({ dest: path.join(__dirname, 'uploads')});

const cookie = require('cookie');

app.use(function (req, res, next){
    req.username = ('username' in req.session)? req.session.username : null;
    console.log("HTTP request", req.username, req.method, req.url, req.body);
    next();
});

function generateSalt (){
    return crypto.randomBytes(16).toString('base64');
}

function generateHash (password, salt){
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    return hash.digest('base64');
}

var isAuthenticated = function(req, res, next) {
    if (!req.session.username) return res.status(401).end("access denied");
    next();
};

var Image = (function(){
    return function item(image, username, file){
        this.title = image.title;
        this.author = username;
        this.file = file;
    };
}());

var Comment = (function(){
    return function user(comment, username){
        this.imageId = comment.imageId;
        this.author = username;
        this.content = comment.content;
    };
}());

// curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signup/
app.post('/signup/', function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    users.findOne({_id: username}, function(err, user){
        if (err) return res.status(500).end(err);
        if (user) return res.status(409).end("username " + username + " already exists");
        let salt = generateSalt();
        let hash = generateHash(password, salt);
        users.update({_id: username},{_id: username, hash: hash, salt: salt}, {upsert: true}, function(err){
            if (err) return res.status(500).end(err);
            req.session.username = username;
            // initialize cookie
            res.setHeader('Set-Cookie', cookie.serialize('username', username, {
                  path : '/', 
                  maxAge: 60 * 60 * 24 * 7
            }));
            return res.json("user " + username + " signed up");
        });
    });
});

// curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signin/
app.post('/signin/', function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    // retrieve user from the database
    users.findOne({_id: username}, function(err, user){
        if (err) return res.status(500).end(err);
        if (!user) return res.status(401).end("User does not exist");
        if (user.hash !== generateHash(password, user.salt)) return res.status(401).end("access denied");
        //session
        req.session.username = username;
        // initialize cookie
        res.setHeader('Set-Cookie', cookie.serialize('username', username, {
              path : '/', 
              maxAge: 60 * 60 * 24 * 7
        }));
        return res.json("user " + username + " signed in");
    });
});

// curl -b cookie.txt -c cookie.txt localhost:3000/signout/
app.get('/signout/', isAuthenticated, function (req, res, next) {
    req.session.destroy();
    res.setHeader('Set-Cookie', cookie.serialize('username', '', {
          path : '/', 
          maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    return res.json("user signed out");
});

// Create

app.post('/api/images/', upload.single('picture'), isAuthenticated, function (req, res, next) {
    let image = new Image(req.body, req.username, req.file);
    images.insert(image, function (err, image) {
        if (err) return res.status(500).end(err);
        return res.json(image);
    });
    
});

app.post('/api/comments/', isAuthenticated, isAuthenticated, function (req, res, next) {
    let comment = new Comment(req.body, req.username);
    comments.insert(comment, function (err, comment) {
        if (err) return res.status(500).end(err);
        return res.json(comment);
    });
});

// Read

app.get('/api/image/:username/', isAuthenticated, function (req, res, next) {
    images.find({author: req.params.username}).sort({createdAt: 1}).skip(parseInt(req.query.page)).limit(1).exec(function(err, image) {
        if (err) return res.status(500).end(err);
        if (image.length == 0) return res.status(404).end('Image page ' + req.query.page + ' or username does not exist');
        return res.json(image);
    });
});

app.get('/api/:username/firstImage/', function (req, res, next) {
    images.find({author: req.params.username}).sort({createdAt: 1}).limit(1).exec(function(err, image) { 
        if (err) return res.status(500).end(err);
        return res.json(image);
    });
});

app.get('/api/comments/:imageId/', isAuthenticated, function (req, res, next) {
    images.find({_id: req.params.imageId}, function(err, image) {
        if (err) return res.status(500).end(err);
        if (image.length == 0) {
            return res.status(404).end('Image id ' + req.params.imageId + ' does not exist');
        } else {
            comments.find({imageId: req.params.imageId}).sort({createdAt:-1}).skip(10 * parseInt(req.query.page)).limit(10).exec(function(err, comments) {
                if (err) return res.status(500).end(err);
                return res.json(comments.reverse());
            });
        }
    });
});

app.get('/api/images/:id/picture/', isAuthenticated, function (req, res, next) {
    images.findOne({_id: req.params.id}, function(err, image){
        if (err) return res.status(500).end(err);
        if (!image) return res.status(404).end('Image id ' + req.params.id + ' does not exist');
        let picture = image.file;
        res.setHeader('Content-Type', picture.mimetype);
        res.sendFile(picture.path);
    });
});

app.get('/api/galleryList/', function (req, res, next) {
    // users.find({}, {_id: 1, hash: 0, salt: 0}, function(err, userObjs) {
    //     console.log("All user list");
    //     console.log(userObjs);
    //     var userList = [];
    //     userObjs.forEach(function(user){
    //         images.findOne({author: user._id}, function(err, image){
    //             console.log(image);
    //             if (image) {
    //                 userList.push(user._id);
    //             };
    //             console.log("inner loop");
    //             console.log(userList);
    //         });
    //         console.log("outter loop");
    //         console.log(userList);
    //     });
    //     console.log("final userlist");
    //     console.log(userList);
    //     return res.json(userList);
    // });
    users.find({}, {_id: 1, hash: 0, salt: 0}, function(err, userObjs) {
        var userList = [];
        userObjs.forEach(function(user){
            userList.push(user._id);
        });
        return res.json(userList);
    });
});

// Delete

app.delete('/api/image/:id/', isAuthenticated, function (req, res, next) {
    images.findOne({_id: req.params.id}, function(err, image){
        if (err) return res.status(500).end(err);
        if (!image) return res.status(404).end("Image id:" + req.params.id + " does not exist");
        let oldDate = image.createdAt;
        if (image.author != req.username) {
            return res.status(401).end("Delete image access denied");
        } else {
            images.remove({ _id: image._id }, function(err, num) {
                images.findOne({createdAt: { $gte: oldDate }}).sort({createdAt:-1}).exec(function (err, nextImage) {
                    if (!nextImage) {
                        images.findOne({createdAt: { $lte: oldDate }}).sort({createdAt:-1}).exec(function (err, prevImage) {
                            return res.json(prevImage);
                        });
                    } else {
                        return res.json(nextImage);
                    }
                });
            });
        }
    });
});

app.delete('/api/comments/:id/', isAuthenticated, function (req, res, next) {
    comments.findOne({_id: req.params.id}, function(err, comment){
        if (err) return res.status(500).end(err);
        if (!comment) return res.status(404).end("Comment id:" + req.params.id + " does not exist");

        images.findOne({_id: comment.imageId}, function(err, image){
            if (err) return res.status(500).end(err);
            if (!image) return res.status(404).end("Image id for comment does not exist");

            if (comment.author == req.username || req.username == image.author) {
                comments.remove({ _id: comment._id }, function(err, num) {
                    return res.json(comment);
                });
            } else {
                return res.status(401).end("Delete comment access denied");
            }
        });
        
    });
});

const http = require('http');
const PORT = 3000;

http.createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});