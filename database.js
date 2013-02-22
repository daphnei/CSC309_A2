/* database.js
 * Methods for accessing database information for this assignment.
 */

var mysql = require("mysql");

// edit as necessary
var HOST = "dbsrv1.cdf.toronto.edu",
    DB = "csc309h_g1biggse",
    PORT = 3306,
    USER = "g1biggse",
    PWD = "boorixae";

// used to connect to the database
var options = {
        host: HOST,
        database: DB,
        port: PORT,
        user: USER,
        password: PWD
    };

function connect() {
    return mysql.createConnection(options);     
}

function disconnect(connection) {
    connection.end();
}
/** Inserts a post liked by one of the tracked blocks into the database.
*
**/
function insertLikedPost(url, username, image, text, note_count) {
    var connection = connect();

	var queryText = "INSERT INTO liked_posts VALUES(" +
						url + ", " +
						username + ", " +
						'CURTIME(), ' + 
						image + ", " +
						text + ", " +
						note_count + ", " +
						'0);';
	connection.query(queryText,
					function(err, rows, fields) {
						if (err) throw err;
		   				else console.log('Inserted new post liked by ' +
		   									username + " with url: " + url);
					});

    disconnect(connection);
}

/** Inserts a new blog to be tracked
*
**/
function insertNewBlog(url, username) {
    var connection = connect();

	var queryText = "INSERT INTO tracked_blogs VALUES(" +
						url + ', ' +
						username + ");";
	connection.query(queryText, 
					function(err, rows, fields) {
						if (err) throw err;
		   				else console.log('Inserted new block to track, ' +
                            'authored by ' + username + " with url: " + url);
					});

    disconnect(connection);
}

function updatePostPopularity(url, increment) {
    var connection = connect();

	// first get the number of updates that have been done for this url, 
    // so that we know what sequence index to use
	var queryText = 'SELECT num_updates FROM liked_posts WHERE url == ' + 
        url + ';';
	var index;
	connection.query(queryText,
					function(err, rows, fields) {
						if (err) throw err;
                        // +1 because this method is making a new update
						else index = rows[0].num_updates + 1; 
					});

	// now, increment num_updates, because this method is doing an update
	queryText = 'UPDATE liked_posts SET num_updates=' + index + 
        'WHERE url ==' + url + ';';
	connection.query(queryText,
					function(err, rows, felds) {
						if (err) throw err;
					});
	
	queryText = "INSERT INTO updates VALUES(" +
					url + ", " +
					"CURTIME(), " + 
					index + ", "  + 
					increment + ");";
	connection.query(queryText,
					function(err, rows, fields) {
						if (err) throw err;
		   				else console.log('Successfully did update ' + 
                            index + 'to url ' + url);
					});	

    disconnect(connection);
}

/*returns the popularity of the input post*/
function getPostPopularity(url) {
    var connection = connect();

    // TODO: Implement this.

    disconnect(connection);
}

/*returns posts in order by their increments in note_count in the last hour.
These will be returned in the JSON format described on the assignment webpage*/
function getTrendingPosts() {
    var connection = connect();

    // TODO: Implement this.

    disconnect(connection);
}

/*returns posts in the order they were made, from most recent to oldest.
These will be returned in the JSON format described on the assignment webpage*/
function getRecentPosts() {
    var connection = connect();

    // TODO: Implement this.

    disconnect(connection);
}

exports.insertLikedPost = insertLikedPost;
exports.insertNewBlog = insertNewBlog;
exports.updatePostPopularity = updatePostPopularity;
exports.getPostPopularity = getPostPopularity;
exports.getTrendingPosts = getTrendingPosts;
exports.getRecentPosts = getRecentPosts;
