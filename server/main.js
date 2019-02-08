var express = require('express')
var app = express()
var Team = require('./src/Team.js');
var bodyParser = require('body-parser');

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

app.get('/create-team-page',function(req,res){
    res.sendFile('static/create-team.html',{ root : __dirname})
})
app.get('/join-team-page',function(req,res){
    res.sendFile('static/join-team.html',{ root : __dirname})
})

app.post('/create-team',function(req,res){
        console.log("create-team...");
        Team.create(req.body.name, req.body.mail,function (token) {
            res.send("'add team' success, team token = " + token)
        });
})
app.post('/add-team-member',function(req,res){
    console.log("add-team-member...");
    Team.addMember(req.body.token, req.body.name, req.body.mail,function () {
        res.send("add member success")
    });
})
app.post('/update-location',function(req,res){
    console.log("update-location...");
    Team.updateLocation(req.body.token,  req.body.name, req.body.location,function (outList) {
        res.send(outList)
    });
})






app.listen(3000)