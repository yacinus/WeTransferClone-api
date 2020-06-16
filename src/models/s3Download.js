const _ = require('lodash');
const {bucket} = require('../config');

class S3Download {

    constructor(app, response) {

        //INITIALIZATION
        this.app = app;
        this.response = response;

    }

    getObject(file) {

        
        const s3 = this.app.s3;

        const options = {
            Bucket : bucket,
            Key : _.get(file, 'name')
        }

        return s3.getObject(options).createReadStream();

    } 

    //FIRST METHOD SLOWER BECAUSE THE USER WILL GET THE DATA VIA PROXY (NOT DIRECTLY FROM DIGITAL OCEAN)
        /*
    download(file) {

        
        const s3 = this.app.s3;
        const response = this.response;

        //GET OBJECT FROM S3
        const fileName = _.get(file, 'originalName');
        response.attachment(fileName);

        const options = {
            Bucket : bucket,
            Key : _.get(file, 'originalName')
        }
        const fileObject = s3.getObject(options).createReadStream();

        fileObject.pipe(response);
    } 
    */

    getDownloadUrl(file){


        const s3 = this.app.s3;
        const fileName = _.get(file, 'name');
        const options = {
            Bucket : bucket,
            Key : fileName,
            Expires : 3600    //EXPIRES AFTER 10 days 864000 seconds
        }

        const url = s3.getSignedUrl('getObject', options);
        return url;
    }
}

module.exports = {

    S3Download

}