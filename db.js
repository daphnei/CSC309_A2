// db.js
// Methods for accessing database information for this assignment.

var mysql = require("mysql");

// edit as necessary
var HOST = "dbsrv1.cdf.toronto.edu",
    DB = "csc309h_g1biggse",
    PORT = 3306,
    USER = "g1biggse",
    PWD = "boorixae";

var connection = null;

function connect() {
    connection = mysql.createConnection({
        host: HOST,
        database: DB,
        port: PORT,
        user: USER,
        password: PWD
    });
    
    connection.connect();
}

exports.connect = connect;
