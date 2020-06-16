const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const http = require('http');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const multerS3 = require('multer-s3');
const stripeLoader = require('stripe')('sk_test_J7rfrxA1TZhxwwkMZSFCHRe300coluHWoY');

const {connect} = require('./database');
const {AppRouter} = require('./router');
const {smtp, s3AccessKey, s3Region, bucket} = require('./config');


//AMAZON S3 SETUP
var AWS = require('aws-sdk');

AWS.config.update(s3AccessKey);

AWS.config.region = s3Region;

// Set S3 endpoint to DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint('fra1.digitaloceanspaces.com/Storage');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint
});

//SETUP EMAIL 
let email = nodemailer.createTransport(smtp);

//FILE STORAGE CONFIGURATION 
/*
const storageDirectory = path.join(__dirname, '..', 'src/Storage');

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDirectory)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
*/
//const upload = multer({storage : storageConfig});   //LOCAL STORAGE

// DIGITAL OCEAN STORAGE CONFIGURATION

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucket,
    acl: 'public-read',
    key: function (request, file, cb) {
      prefix = Date.now().toString();
      const fileName = `${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    }
  })        
});   

const charge = (token, amount) => {
  return stripeLoader.charges.create({
    amount : amount * 100,
    currency : 'usd',
    source : token,
    description : "Statement Description"
  });
}

/*
 const params = {
  Bucket: bucket,  
  LifecycleConfiguration: {
    Rules: [
       {
      Expiration: {
        Days: 0
       }, 
      Filter: {
        Prefix: prefix
       },
      ID: "ID", 
      Status: "Enabled"
     }
    ]
   }
}
/*
const putObjectExpiration = () => {
  s3.putBucketLifecycleConfiguration({
    Bucket: bucket,  
      LifecycleConfiguration: {
        Rules: [
          {
          Expiration: {
            Days: 0
          }, 
          Filter: {
            Prefix: prefix
          },
          ID: "ID", 
          Status: "Enabled"
        }
        ]
      }
  }, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  }); 
}  
/*
 s3.getBucketLifecycleConfiguration(params, function(err, file) {
   if (err) console.log(err, err.stack); // an error occurred
   else     console.log(file);           // successful response
 });
*/
 

//END OF FILE STORAGE CONFIGURATION 

const PORT = 8000;   //initialize the PORT
const app = express() //Create the express const
app.server = http.createServer(app); //create the SERVER

app.use(morgan('dev')); //add morgan middleWare to generate logs of server automatically


app.use(cors({credentials: true, origin: 'http://localhost:3000'}));  //add core functions

app.use(bodyParser.json({
  limit : '50mb'            //add limit to the body of request
}))

//set routes to folders
app.set('root', __dirname);                   
//app.set('storageDirectory', storageDirectory);
//app.set('upload', upload);  UPLOAD FOR THE LOCAL CONFIG  I changed the variable name from 'upload'
app.upload = upload;  
app.email = email;
app.charge = charge;
//app.putObjectExpiration = putObjectExpiration;
app.s3 = s3;

//connect to the DB
connect((err, db) => {

  app.db = db;
  app.set('db', db); //set the route to the DB

  db.collection('tokens').createIndex( { "createAt": 1 }, { expireAfterSeconds: 86400 } );
  
  if(err) {
    console.log("Error connecting the MONGO database")
    throw(err);
  }

  //init routers
  new AppRouter(app);

  //start the server listening
  app.server.listen(process.env.PORT || PORT, () => {
    console.log(`App is running on port ${app.server.address().port}`);
  });

})

