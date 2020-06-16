const archiver = require('archiver');
const _ = require('lodash');
const path = require('path');
const {S3Download} = require('./s3Download');

class FileArchiver {

    constructor(app, files = [], response) {

        this.app = app;
        this.files = files;
        this.response = response;

    }

    download(){

        const app = this.app;
        const files = this.files;
        const response = this.response;
        let fullPath = null;
        //const uploadDir = app.get('storageDirectory');
        const zip = archiver('zip');

        response.attachment('download.zip');
        zip.pipe(response);

        const s3Downloader = new S3Download(app, response);
        
        _.each(files, (file) => {
       /*     const filePath = path.join(uploadDir, _.get(file, 'name'));
            zip.file(filePath, {name : _.get(file, 'originalName')});  */
            fullPath = _.get(file, 'fullPath');
            const fileObject = s3Downloader.getObject(file);
            if(fullPath === null || fullPath === ''){
                zip.append(fileObject, {name : _.get(file, 'originalName')});
            } else {
                zip.append(fileObject, {name : _.get(file, 'fullPath')});
            }
            

        })

        zip.finalize();

        return this;
    }

}

//Export modules
module.exports = {
    FileArchiver
}
