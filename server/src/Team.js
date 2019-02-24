

var randtoken = require('rand-token'),
    MongoClient = require('mongodb').MongoClient;
var geolib =require("geolib");


var Team = module.exports = {
    create : function(teamName,creatorName,mail,creator,cb){
        if(Team.isValidName(teamName) && Team.isValidMail(mail)){
            MongoClient.connect('mongodb://localhost:27017/', { useNewUrlParser: true },function (err, client) {
                if (err) throw err;
                var token= Team.generateToken()
                console.log("token: " + token)
                var team = { name: teamName, creator:creator , token:token,outList:[], members:{}};
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
                        cb(creator? teamToken: "member '" + memberName + "' added")
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
                //cb(err || "Creator location was updated");
            })
        })
    },
    updateLocation: function(teamToken,memberName, location, cb){  //todo: update all function to work like this, first of all get doc from redis then work with it indie the memory.
        Team.getRelevantDocFromMongo({token:teamToken},(doc)=>{
            console.log(`update  Location...`);
            if(Team.isTeamExist(doc,teamToken) && Team.isMemberExist(doc,memberName) ){
                var teamName;
                if(Team.isCreator(doc,memberName) ) {
                    console.log("update creator location...")
                    Team.updateCreatorLocation(teamToken, location)
                }
                else{
                    if(Team.outSideTheArea(doc,location)){
                        doc=Team.addMemberToOutList(doc,memberName); //async upadte the list but sync return the current list state.
                    }

                }
                return cb(doc.outList) //return out list to everyone...
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
        return doc && doc.members[memberName] && true
    },
    isCreator: function(doc, memberName){
        return doc.members[memberName].creator;
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

    },
    outSideTheArea: function (doc, location) {

            //{latitude: 51.5103, longitude: 7.49347},
            //{latitude: "51° 31' N", longitude: "7° 28' E"}
        console.log("in outSideTheArea....")

        return geolib.getDistanceSimple(eval('(' + location + ')'),eval('(' + doc.location + ')')) > 20;
    },
    addMemberToOutList: function (doc,memberName) {
        if (!doc.outList.includes(memberName)){
            doc.outList.push(memberName);
            MongoClient.connect('mongodb://localhost:27017/', {useNewUrlParser: true}, function (err, client) {
                if (err) throw err;
                var col = client.db("general").collection('teams');

                var outList = doc.outList.push(memberName)
                col.update({token: doc.token}, {
                    $set: {
                        [outList]: doc.outList
                    }
                }, {}, function (err, res) {
                    if (err) throw err;
                    console.log("out list of team" + doc.token + " was updated with  " + memberName)
                    client.close();
                })

            })

            return doc;
        }
        return doc;
    }
}
