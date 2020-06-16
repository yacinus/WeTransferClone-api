const _ = require('lodash');

class FileModel {

    //Create the json object model
    constructor(app){
        this.app = app;
        this.model = {
            name : null,
            originalName : null,
            mimeType : null,
            size : null,
            etag : null,
            fullPath : null,
            createdAt : Date.now()
        };
    }

    //Get all the the fields of the object from its arguments 
    initWithObject = (object, fullPath) => {
        this.model.name = _.get(object, 'key');
        this.model.originalName = _.get(object, 'originalname');
        this.model.mimeType = _.get(object, 'mimetype');
        this.model.size = _.get(object, 'size');
        this.model.etag = _.get(object, 'etag');
        this.model.fullPath = fullPath;
        this.model.createdAt = Date.now();

        return this;
    }

    //convert to json object
    toJSON = () => {
      return this.model;
    }
}

//Export modules
module.exports = {
    FileModel
}