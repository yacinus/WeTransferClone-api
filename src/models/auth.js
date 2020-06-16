const {ObjectID} = require('mongodb');
const _ = require('lodash');


class Auth {

    constructor(app) {

        this.app = app;

        this.model = {

            userId : null,
            createAt : null

        }

        this.createToken = this.createToken.bind(this);
        this.checkAuthorization = this.checkAuthorization.bind(this);

    }

    createToken(user, callback = () => {}) {

        let model = this.model;
        const db = this.app.db;
        
        model.userId = user._id;
        model.createAt = new Date();

        db.collection('tokens').insertOne(model, (err, token) => {

            return callback(err, token);

        });

    }

    checkAuthorization(req, callback = () => {}) {

        let token = req.get("authorization");
        //let token = null;
        console.log('token key here : ', token);

        if(!token) {
            
            return callback(false, "");
        }

        const db = this.app.db;

        const query = {
            _id : new ObjectID(token)
        }

        db.collection('tokens').find(query).limit(1).toArray((err, tokenObject) => {

            const tokenObj = _.get(tokenObject, '[0]', null);
            
            console.log('tokenObj : ', tokenObj);

            if(err === null && tokenObj){

                const userId = _.get(tokenObject, '[0].userId', null);

                const query = {
                    _id : new ObjectID(token)
                }

                db.collection('tokens').deleteOne(query);

                console.log('userId from AUTH : ' , userId);

                let model = this.model;
                
                model.userId = userId;
                model.createAt = new Date();

                db.collection('tokens').insertOne(model, (err, token) => {

                    if(err === null && token) {
                        console.log('isLogged === true');
                        return callback(true, token);
                    }
                    console.log('isLogged === false')
                    return callback(false, null);

                });

            } else {
                console.log('error : ', err);
                return callback(false, null);
            }

        });
    }

}

module.exports = {
    Auth
}