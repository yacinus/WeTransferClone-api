const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017/mydb';
 
// Database Name
const dbName = 'myproject';

//connect function MONGODB
const connect = (callback) => {
    MongoClient.connect(url,(err, client) => {
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        return callback(err, db);
    });
}

//Export modules 
module.exports = {
    connect
}
