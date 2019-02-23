

var randtoken = require('rand-token'),
    MongoClient = require('mongodb').MongoClient;


var Team = module.exports = {
    create : function(teamName,creatorName,mail,creator,cb){
        if(Team.isValidName(teamName) && Team.isValidMail(mail)){
            MongoClient.connect('mongodb://localhost:27017/', { useNewUrlParser: true },function (err, client) {
                if (err) throw err;
                var token= Team.generateToken()
                console.log("token: " + token)
                var team = { name: teamName, creator:creator , token:token, members:{}};
                var db = client.db("general");
                db.collection("teams").insertOne(team, function(err, res) {
                    if (err) throw err;
                    console.log("team '" + teamName + "' added");
                    client.close()
                    Team.addMember(token,creatorName,mail,creator,cb)

                });
            })
        }
        else return cb("email or team name is not valid")

    },
    addMember: function(teamToken,memberName,memberMail,creator,cb){
        Team.getRelevantDocFromMongo({token:teamToken},(doc)=> {
            if (Team.isTeamExist(doc,teamToken) && !Team.isMemberExist(doc,memberName)) {
                MongoClient.connect('mongodb://localhost:27017/', {useNewUrlParser: true}, function (err, client) {
                    if (err) throw err;
                    console.log("token: " + teamToken);
                    //var member = {name: memberName, mail: memberMail};
                    //var db = client.db("general");
                    //var query = { teamToken: teamToken };
                    var col = client.db("general").collection('teams');
                    var memberNameString = `members.${memberName}`;
                    col.update({token: teamToken}, {
                        $set: {
                            [memberNameString]: {
                                "mail": memberMail,
                                creator: creator
                            }
                        }
                    }, {}, function (err, res) {
                        if (err) throw err;
                        console.log("member '" + memberName + "' added");
                        client.close();
                        cb()
                    })
                })
            } else return cb("team is not exist or member already exist")
        })
    },
    updateCreatorLocation: function(teamToken, location, cb){
        console.log(`update Creator Location...`)
        MongoClient.connect('mongodb://localhost:27017/', { useNewUrlParser: true },function (err, client) {
            var col = client.db("general").collection('teams');
            col.updateOne({token: teamToken}, {$set: {"location": location}}, {}, function (err, res) {
                if (err) throw err;
                console.log(`location was updated`);
                client.close();
                cb(res.outList)
            })
        })
    },
    updateLocation: function(teamToken,memberName, location, cb){  //todo: update all function to work like this, first of all get doc from redis then work with it indie the memory.
        Team.getRelevantDocFromMongo({token:teamToken},(doc)=>{
            console.log(`update  Location...`);
            if(Team.isTeamExist(doc) && Team.isMemberExist(doc,memberName) ){
                var teamName;
                if(Team.isCreator(doc,teamToken,memberName) ) {
                    consule.log("update creator location...")
                    Team.updateCreatorLocation(teamToken, location, cb)
                }
                else{
                    if(outSideTheArea(location)){
                        doc=addMemberToOutList(doc,memberName);
                    }

                }
                return cb(doc.outList)
            }
            else return cb("team or member is not exist")
        })

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
    isTeamExist: function (doc,teamToken) {
        return doc && doc.token==teamToken
    },
    isMemberExist: function (doc,memberName) {
        return doc && doc.members[memberName]
    },
    getRelevantDocFromMongo(filter,cbFunc) {
        console.log("getRelevantDocFromMongo....")
        MongoClient.connect('mongodb://localhost:27017/', {useNewUrlParser: true}, function (err, client) {
            console.log("after connection in getRelevantDocFromMongo....")
            if (err) throw err;
            var col = client.db("general").collection('teams',(err, col)=>{
                col.find(filter).toArray((err,items)=>{
                    console.log(items);
                    cbFunc(items[0])
                })



            });

         })

    }
}
