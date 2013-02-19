var mysql = require('mysql');
var connection = mysql.createConnection({
    host : 'dbsrv1.cdf.toronto.edu',
    database: 'csc309h_g1biggse',
    port : 3306,
    user : 'g1biggse',
    password: 'boorixae',
});

connection.connect();

connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
    if (err) throw err;
    console.log('The solution is:', rows[0].solution);
});

connection.end();
