const {version} = require('../package.json');
const path = require('path');
const _ = require('lodash');
const {FileModel} = require('./models/file');
const {ObjectID} = require('mongodb');
const {Email} = require('./models/email');
const {Post} = require('./models/post');
const {FileArchiver} = require('./models/filearchiver');
//const {FileUploadArchiver} = require('./models/fileaUploadArchiver');
const {S3Download} = require('./models/s3Download');
const {User} = require('./models/user');
const {Auth} = require('./models/auth');


class AppRouter {
    constructor(app){
        this.app = app
        this.setupRouters();
    }

    setupRouters = () => {

        const app = this.app;

        //retrive the path set on server.js
        //const uploadDirectory = app.get('storageDirectory');
        //const upload = app.get('upload'); 
        const db = app.get('db');
        const upload = app.upload;
        const charge = app.charge;
        //const putObjectExpiration = app.putObjectExpiration;

        //root routing (return the result : version on the index page)
        app.get('/', (req, res, next) => {
            
            return res.status(200).json({
                version : version
            })
        }); 
   
        //UPLOAD ROUTING
        app.post('/api/upload', upload.array('files'), (req, res, next) => { //Post the files uploaded
    
            const files = _.get(req, 'files', []); //Get the Array of files
            const filesPaths = _.get(req, 'body.pathsOfFiles', []);

            console.log('files objects from front end :', files);
            console.log('files paths objects from front end :', filesPaths);

            let fileModel = []; //Create the temporary Table

             //Loop on the array files created earlier
                for(let i=0;i<files.length;i++){

                    //Create an instance of FileModel, map the fileObject and convert it to json
                const newFile = new FileModel(app).initWithObject(files[i], filesPaths[i]).toJSON();

                fileModel.push(newFile);  //add the files to the array

                }

            //SAVE the JSON informations into MONGODB 
            if(fileModel.length){
                console.log('filemodel.length : ', fileModel.length);
                db.collection('files').insertMany(fileModel, ((err, result) => {
                    if (err) {
                        return res.status(503).json({
                            message : "unable to insert documents to the Database !"
                        })
                    }

                    console.log("user request via api/upload with data", req.body, result);

                    //CREATE OBJECT Post AND ADD from, to, message, files ON IT
                    let post = new Post(app).initWithObject({
                        from : _.get(req, 'body.from'),
                        to : _.get(req, 'body.to'),
                        message : _.get(req, 'body.message'),
                        files : result.insertedIds  //in order to save the id of the image within the user's information on DB

                    }).toJSON();

                    //SAVE POSTED OBJECT TO COLLECTION : post ON MONGODB
                    db.collection('posts').insertOne(post, ((err, result) => {
                        if (err) {
                            return res.status(503).json({
                                message : "unable to insert FROM TO MESSAGE FILENAME to the Database !"
                            })
                        }

                    //uploadFile(files, filesPaths, result.insertedIds, res);    

                    //implement email sending to user with download link
                        //SEND EMAIL 

                    const sendEmail = new Email(app).sendInvitationToDownloadFiles(post, (err, info) => {

                        if(err){
                             console.log("error sending email", err);
                        } 

                    });

                    // Callback  to react app with post details
                    return res.json(post);
                }))

                }))
            } else {
                return res.status(503).json({
                    message : "Files upload required"
                });
            }

            //putObjectExpiration();
        });
        

        //DOWNLOAD ROUTING 
        app.get('/api/download/:id', (req, res, next) => { //Get the files with their tokens

            const fileId = req.params.id; //receive ID of file

        db.collection('files').find({_id : ObjectID(fileId)}).toArray((err, result) => {

            const fileName = _.get(result, '[0].name');

            if(err || !fileName)
            {
                return res.status(404).json({
                    error : {
                        message : "File not found"
                    }
                })
            }

            //DOWNLOOAD FILE FROM S3 SERVICE
            const file = _.get(result, '[0]');
            const downloader = new S3Download(app, res);
            
            //return downloader.download(file);    //PROXY DOWNLOAD FROM S3 SERVICE

            //DOWNLOAD DIRECTLY FROM S3

            const downloadUrl = downloader.getDownloadUrl(file);
            console.log('downloadUrl = ', downloadUrl);
            
            
            return res.redirect(downloadUrl);
            
            /*
            const filePath = path.join(uploadDirectory, fileName); //receive the path of file

            //DOWNLOAD THE FILE AND PUT IT TO THE APPROPRIATE FOLDER WITH ITS NAME
            return res.download(filePath, _.get(result, '[0].originalName' ), (err) => {
                if(err){
                    return res.status(404).json({
                        error : {
                            message : "file not found !"
                        }
                    });
                } else {
                    console.log("file is downloaded");
                }
            })  */



            })
        });

        //ROUTING TO POST DETAILS /api/posts:id
    
        app.get('/api/posts/:id', (req,res,next) => {
            
            const postId = _.get(req, 'params.id');
            
            this.getPostById(postId, (err,result) => {
                if (err) {
                    return res.status(404).json({error : {message : 'File not Found'}});
                }

                return res.json(result);
            })
        })

        //ROUTING FOR DOWNLOADING ZIP FILES
        app.get('/api/posts/:id/download/', (req,res,next) => {

            const id = _.get(req, 'params.id');

            this.getPostById(id, (err,result) => {
                if (err) {
                    return res.status(404).json({error : {message : 'File not Found'}});
                }

                const files = _.get(result, 'files', []);
                const archiver = new FileArchiver(app, files, res).download();

                return archiver;
            })
        })

        //CREATE NEW USER POST
        app.post('/api/users', (req, res, next) => {


            const body = _.get(req,'body');

            console.log("data from frontend posted : ", body);

            const user = new User(app);
            user.initWithObject(body).create((err, newUser) => {

                console.log("new user created with error & callback" , err, newUser);

                if(err) {
                    console.log(err);
                    return res.status(503).send({

                        error : {message : err}

                    })

                }

                return res.status(200).json(newUser);

            });

        });

        //SEND CREDIT CARD INFOS TO STRIPE 
        app.post('/api/payments', async (req, res, next) => {

            try{

                const body = _.get(req, 'body', {});

                const token = _.get(body , 'token.id');
                const amount = _.get(body, 'amount');

                console.log('token : ', token );
                console.log('amount : ', amount);

                let data = await charge(token, amount);

                console.log('data : ', data);

                res.send("charged !");

            }catch(err) {
                console.log(err);
            }

        })


        //Login USER
        app.post('/api/users/login', (req, res, next) => {

            
            const body = _.get(req, 'body', {});
            
            const user = new User(app);

            const email = _.get(body, 'email');
            const password = _.get(body, 'password');

            user.login(email, password, (err, token) => {

                if(err) {
                    return res.status(401).json({
                        message : "error occured loging your account"
                    })
                }
                return res.status(200).send(token);
        });
    });

        //GET PROFILE DETAILS
        app.get('/api/users/:id', (req, res, next) => {

            const userId = req.params.id;

            console.log('id : ', userId);

            const auth = new Auth(app); 

            auth.checkAuthorization(req, (isLogged, token) => {

                console.log('logged : ' , isLogged);

                if(!isLogged) {

                    return res.status(401).json({
                        message : "Unauthorized"
                    })

                }

                    const userId = _.get(req, 'params.id', null);
                    const user = new User(app);

                    user.findById(userId, (error, user) => {

                        if(error) {
                            return res.status(404).json({
                                message : "user not found"
                            })
                        }
                            
                        return res.status(200).send({
                            user : user,
                            token : token
                        });

                    });

            });

        });

    }

    getPostById(id, callback = () => {}){

        console.log(id);
        const app = this.app;
        const db = app.get('db');

            let postObjectId = null;
            try {
                postObjectId = new ObjectID(id);
            }
            catch (err){
                return callback(err, null);
            }

            db.collection('posts').find({_id: postObjectId}).limit(1).toArray((err, results) => {
                
                let result = _.get(results, '[0]');
                if(err || !result) {
                    return callback(err ? err : new Error('file not found !'));
                }

                const fileIds = _.get(result, 'files', []);

                db.collection('files').find({_id: {$in: Object.values(fileIds)}}).toArray((err, files) => {

                    if(err || !files || !files.length){
                        return callback(err ? err : new Error('file not found !'));
                    }
                    
                    result.files = files;
                    return callback(null, result);

                }); 
            })

    }


}

module.exports = {
    AppRouter
}