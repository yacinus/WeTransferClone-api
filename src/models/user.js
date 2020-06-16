const _ =  require('lodash');
const bcrypt = require('bcrypt');
const {Auth} = require('./auth');
const {ObjectID} = require('mongodb');
const saltRounds = 10;

class User {

    constructor(app) {

        this.app = app;
        this.model = {
            yearly : false,
            monthly : false,
            name : "",
            email : "",
            password : "",
            company : "",
            vat : "",
            address : "",
            city : "",
            zip : "",
            country : "",
            created : new Date(),
            updated : null
        }
        
        this.findUserByEmail = this.findUserByEmail.bind(this);
        this.login = this.login.bind(this);
        this.findById = this.findById.bind(this);

    }

    findById = (id, callback = () => {}) => {

        const db = this.app.db;
        const query = {
            _id : ObjectID(id)
        }

        db.collection('users').find(query).limit(1).toArray((err, result) => {

            const user = _.get(result, '[0]', null);
            
            if(err === null && user) {
                delete user.password;
                return callback(null, user);

            }
            const error = {message : "user not found !"}
            return callback(error, null)

        })

    }

    login = (email, password, callback = () => {}) => {
        const app = this.app;
        let error = null;
        //let user = {"email" : "bekhechiyacine@hotmail.com", "password" : "12345"};
        console.log("Email :", email, "password", password);

        if(!email || !password) {

            error = {message : "email or password not found !"};
            return callback(error, null);

        }

        this.findUserByEmail(email, (err,user) => {

            if(err === null && user) {
                //Compare the password 
                console.log('password : ', password);
                console.log('user.password', user.password);

                const passwordCheck = bcrypt.compare(password, user.password);

                console.log('passwordCheck : ', passwordCheck);

                if(passwordCheck) {
                    
                //CREATE NEW TOKEN AND RETURN THIS TOKEN KEY FOR USER AND USE IT FOR LATER 
                //REQUESTS
                const auth = new Auth(app);

                auth.createToken(user, (err, token) => {

                    console.log('token created with err and token', token);

                    if(err){

                        error = {message : "Error loging to you account"};
                        callback(error, null);

                    }

                    delete user.password;
                    
                    token.user = user;
                    return callback(null, token);
                });

                }
                else {
                    error = {message : "password does not match !"};
                    return callback(error, null);
                }
                

            }

            if(err || !user){

                error = {message : "Error loging to your account"}
                return callback(error, null);
            }
        })

    }

    initWithObject(obj) {

        this.model.yearly = _.toLower(_.trim(_.get(obj, 'yearly', false)));
        this.model.monthly = _.toLower(_.trim(_.get(obj, 'monthly', false)));
        this.model.name = _.toLower(_.trim(_.get(obj, 'name', null)));
        this.model.email = _.toLower(_.trim(_.get(obj, 'email', null)));
        this.model.password = _.toLower(_.trim(_.get(obj, 'password', null)));
        this.model.company = _.toLower(_.trim(_.get(obj, 'company', null)));
        this.model.vat = _.toLower(_.trim(_.get(obj, 'vat', null)));
        this.model.address = _.toLower(_.trim(_.get(obj, 'address', null)));
        this.model.city = _.toLower(_.trim(_.get(obj, 'city', null)));
        this.model.zip = _.toLower(_.trim(_.get(obj, 'zip', null)));
        this.model.country = _.toLower(_.trim(_.get(obj, 'country', null)));
        //this.model.created = _.get(obj, 'created', null);
        //this.model.updated = _.get(obj, 'updated', null);

        return this;
    }

    findUserByEmail(email = null, callback = () => {}) {
        const app = this.app;
        const db = app.db;
        const query = { email : email};
        db.collection('users').find(query).limit(1).toArray((err, result) => {
            
            return callback(err, _.get(result, '[0]', null));
            
        })

        
    }

    validate(callback = () => {}) {

        const model = this.model;
        const app = this.app;
        const db = app.db;

        let errors = [];

        if(model.password.length < 3) {

            errors.push({
                message : "password should contain more than 3 characters !"
            })
        }

        this.findUserByEmail(model.email, (err, user) => {

            if(err || user) {
                errors.push({
                    message : "This email address is already in use"
                })
            }
            //console.log(err, result);
            return callback(errors);
        });
        
    }

    create(callback) {

        let model = this.model;
        const app = this.app;
        const db = app.db;
        
        this.validate((errors) => {

            let messages = [];
            if(errors.length > 0) {

                _.each(errors, (err) => {

                    messages.push(err.message);

                })

                return callback(_.join(messages, ' , '), null)
            }

            //bcrypt.hash(model.password, saltRounds, function(err, hash) {

                const hash = bcrypt.hashSync(model.password, saltRounds);
                model.password = hash;
                
                db.collection('users').insertOne(model, (err, result) => {
                    return callback(err, result);
                })

            //});
            
            

        })

        

    }

}

module.exports = {

    User

}