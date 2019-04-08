var express = require('express')
var app = express()
var Team = require('./src/Team.js');
var bodyParser = require('body-parser');
var fs = require('fs');

var https = require('https');
var privateKey  = fs.readFileSync('/data/find-my-team/server/sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('/data/find-my-team/server/sslcert/server.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};



app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.get('/', function (req, res) {
    res.sendFile('static/home.html',{ root : __dirname})
})

/*app.use(function timeLog (req, res, next) {
    if(req.token && isValidToken(req.token))
        next();
    else
        res.sendFile('static/home.html',{ root : __dirname})
})*/

app.get('/create-team',function(req,res){
    res.sendFile('static/create-team.html',{ root : __dirname})
})
app.get('/join-team',function(req,res){
    res.sendFile('static/join-team.html',{ root : __dirname})
})
app.get('/team-page',function(req,res){
    res.sendFile('static/team-page.html',{ root : __dirname})
})
app.get('/',function(req,res){
    res.sendFile('static/home.html',{ root : __dirname})
})

app.post('/create-team',function(req,res){
        console.log("create-team...");
        Team.create(req.body.name,req.body.creatorName , req.body.mail,true,function (token) {
            res.send("'add team' success, team token = " + token)
        });
})
app.post('/add-team-member',function(req,res){
    console.log("add-team-member...");
    Team.addMember(req.body.token, req.body.name, req.body.mail,null,function (err) {
        res.send(err || "add member success")
    });
})
app.post('/update-location',function(req,res){
    console.log("update-location...");
    Team.updateLocation(req.body.token,  req.body.name, req.body.location,function (outList) {
        res.send(outList)
    });
})




var httpsServer = https.createServer(credentials, app);
httpsServer.listen(4433);