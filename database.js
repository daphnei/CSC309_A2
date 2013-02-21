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

/** Inserts a post liked by one of the tracked blocks into the database.
*
**/
function insertLikedPost(url, username, image, text, note_count) {
	connection.query('INSERT INTO liked_posts VALUES(' +
						url + ", " +
						username + ", " +
						'CURTIME(), ' + 
						image + ", " +
						text + ", " +
						note_count + ", " +
						'0);',
			function(err, rows, fields) {
    			if (err) throw err;
   				else console.log('Inserted new post liked by ' +
   									username + " with url: " + url);
			});
}

/** Inserts a new blog to be tracked
*
**/
function insertNewBlog(url, username) {
	connection.query('INSERT INTO tracked_blogs VALUES(' +
						url + ", " +
						username + ");", 
			function(err, rows, fields) {
    			if (err) throw err;
   				else console.log('Inserted new block to track, authored by ' +
   									username + " with url: " + url);
			});
}

function updatePostPopularity(url, increment) {
		
}

/*returns the popularity of the input post*/
function getPostPopularity(url) {

}

/*returns posts in order by their increments in note_count in the last hour.
These will be returned in the JSON format described on the assignment webpage*/
function getTrendingPosts() {

}

/*returns posts in the order they were made, from most recent to oldest.
These will be returned in the JSON format described on the assignment webpage*/
function getRecentPosts() {

}

exports.connect = connect;
