const _ = require('lodash');

class Post {

    constructor(app){
        this.app = app;

        this.model = {
            from : null,
            to : null,
            message : null,
            files : null,
            createdAt : new Date()
        }
    }

    initWithObject(obj){

        this.model.from = _.get(obj, 'from');
        this.model.to = _.get(obj, 'to');
        this.model.message = _.get(obj, 'message');
        this.model.files = _.get(obj, 'files', []);
        this.model.createdAt = _.get(obj, 'createdAt', new Date())

        return this;
    }

    toJSON(){
        return this.model;
    }

}

module.exports = {
    Post
} 
