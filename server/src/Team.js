

var randtoken = require('rand-token'),
    MongoClient = require('mongodb').MongoClient;


var Team = module.exports = {
    create : function(name,creator,cb){
        if(Team.isValidName(name) && Team.isValidMail(creator)){
            MongoClient.connect('mongodb://localhost:27017/', { useNewUrlParser: true },function (err, client) {
                if (err) throw err;
                var token= Team.generateToken()
                console.log("token: " + token)
                var team = { name: name, creator:creator , token:token, members:{}};
                var db = client.db("general");

                db.collection("teams").insertOne(team, function(err, res) {
                    if (err) throw err;
                    console.log("team '" + name + "' added");
                    client.close();
                    cb(token)
                });
            })
        }
        else return "email or team name is not valid"

    },
    addMember: function(teamToken,memberName,memberMail,cb){
        if(Team.isTeamExist(teamToken) && !Team.isMemberExist(memberName)){
            MongoClient.connect('mongodb://localhost:27017/', { useNewUrlParser: true },function (err, client) {
                if (err) throw err;
                console.log("token: " + teamToken);
                //var member = {name: memberName, mail: memberMail};
                //var db = client.db("general");
                //var query = { teamToken: teamToken };
                var col = client.db("general").collection('teams');
                var memberNameString = `members.${memberName}`;
                col.update({token:teamToken},{$set:{[memberNameString]:{"mail":memberMail}}},{},function(err, res){
                    if (err) throw err;
                    console.log("member '" + memberName + "' added");
                    client.close();
                    cb()
                })
            })
        }
        else return "team is not exist or member already exist"
    },
    updateCreatorLocation: function(teamToken, location, cb){
        console.log(`update Creator Location...`)
        if(Team.isTeamExist(teamToken) ){
            var teamName;
            MongoClient.connect('mongodb://localhost:27017/', { useNewUrlParser: true },function (err, client) {
                if (err) throw err;
                console.log("token: " + teamToken);
                var col = client.db("general").collection('teams');
                col.findOne({token:teamToken},(err,res)=>{
                    teamName= res.name
                });
                col.updateOne({token:teamToken},{$set:{"location":location}},{},function(err, res){
                    if (err) throw err;
                    console.log(`team '${teamName}' location was updated`);
                    client.close();
                    cb()
                })
            })
        }
        else return "team is not exist or member already exist"
    },
    generateToken: function(){
        return randtoken.generate(8);
    },
    isValidName: function (name) {
        return true
    },
    isValidMail: function (mail) {
        return true
    },
    isTeamExist: function (teamToken) {
        return true
    },
    isMemberExist: function (memberName) {
        return false
    }


}
