/* database.js
 * Methods for accessing database information for this assignment.
 */

var mysql = require("mysql");

var QUOTE = "'";

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

/**
 * Connect to the database.
 *
 * @returns A connection to the database. Call disconnect on this object when
 *		  you're done with it.
 */
function connect() {
	return mysql.createConnection(options);	 
}

/**
 * Disconnects a connection from the database.
 *
 * @param connection An active connection to the database.
 */
function disconnect(connection) {
	connection.end();
}

/**
 * Inserts a post liked by one of the tracked blogs into the database.
 *
 * @param url The url of the post liked.
 * @param username The username of the author of the post.
 * @param image An image used to describe the post. Null if post is imageless.
 * @param text The text of the post. Null if post has no text.
 * @param note_count How many notes have been made so far on the post.
 * 
 * @returns true upon success, false otherwise
 */
function insertLikedPost(url, username, image, text, note_count) {
	var connection = connect();
	if (!connection) 
		return false;
		
	var queryText = "INSERT INTO liked_posts VALUES(" +
						QUOTE + url + QUOTE + ", " +
						QUOTE + username + QUOTE + ", " +
						'CURTIME(), ' + 
						QUOTE + image + QUOTE + ", " +
						QUOTE + text + QUOTE + ", " +
						note_count + ", " +
						'0);';
	connection.query(queryText,
					function(err, rows, fields) {
						if (err) throw err;
		   				else console.log('Inserted new post liked by ' +
		   									username + " with url: " + url);
					});

	disconnect(connection);
	return true;
}

/**
 * Inserts a new blog to be tracked.
 *
 * @param url The url of the blog.
 * @param username The username of the owner of the blog.
 * 
 * @returns true upon success, false otherwise
 */
function insertNewBlog(url, username) {
	var connection = connect();
	if (!connection)
		return false;
	var queryText = "INSERT INTO tracked_blogs VALUES(" +
						QUOTE + url + QUOTE + "," +
						QUOTE + username + QUOTE + ");";
	console.log(queryText);
	connection.query(queryText, 
					function(err, rows, fields) {
						if (err) throw err;
		   				else console.log('Inserted new block to track, ' +
							'authored by ' + username + " with url: " + url);
					});

	disconnect(connection);
	return true;
}

/**
 * Makes an update to the popularity of a post.
 *
 * @param url The url of the post.
 * @param increment How much the post's popularity(note count) has increased
 *				  since the last update.
 * 
 * @returns true upon succes, false if there was a failure
 */
function updatePostPopularity(url, increment) {
	var connection = connect();
	if (!connection) 
		return false;
		
	// first get the number of updates that have been done for this url, 
	// so that we know what sequence index to use
	var queryText = 'SELECT num_updates FROM liked_posts WHERE url == ' + 
		QUOTE + url + QUOTE + ';';
	var index;
	connection.query(queryText,
					function(err, rows, fields) {
						if (err) throw err;
						// +1 because this method is making a new update
						else index = rows[0].num_updates + 1; 
					});

	// now, increment num_updates, because this method is doing a new update
	queryText = 'UPDATE liked_posts SET num_updates=' + index + 
		'WHERE url ==' + QUOTE + url + QUOTE + ';';
	connection.query(queryText,
					function(err, rows, felds) {
						if (err) throw err;
					});
	
	queryText = "INSERT INTO updates VALUES(" +
					QUOTE + url + QUOTE + ", " +
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
	return true;
}

/**
 * Returns the popularity of the input post.
 *
 * @param url The url of the post.
 */
function getPostPopularity(url) {
	var connection = connect();

	// TODO: Implement this.

	disconnect(connection);
}

/**
 * Returns posts in order by their increments in note_count in the last hour.
 * These will be returned in the JSON format described on the assignment 
 * webpage.
 */
function getTrendingPosts() {
	var connection = connect();

	// TODO: Implement this.

	disconnect(connection);
}

/**
 * Returns posts in the order they were made, from most recent to oldest.
 * These will be returned in the JSON format described on the 
 * assignment webpage.
 */
function getRecentPosts() {
	var connection = connect();

	// TODO: Implement this.

	disconnect(connection);
}

/**
 * clears all entries in all the table. Mainly used for testing, in reality
 * we should not have to every call this.
 * 
 * @returns trur upon success, false for failure
 */
function clearDatabase() {
	var connection = connect();
	if (!connection)
		return false;
	var query = 'TRUNCATE TABLE tracked_blogs; ' + 
				'TRUNCATE TABLE liked_posts; ' +
				'TRUNCATE TABLE likes; ' +
				'TRUNCATE TABLE updates; ';
	
	connection.query(queryText,
					function(err, rows, fields) {
						if (err) throw err;
		   				else console.log('Successfully cleared the database.');
					});
	disconnect(connection);
	return true;
}

exports.insertLikedPost = insertLikedPost;
exports.insertNewBlog = insertNewBlog;
exports.updatePostPopularity = updatePostPopularity;
exports.getPostPopularity = getPostPopularity;
exports.getTrendingPosts = getTrendingPosts;
exports.getRecentPosts = getRecentPosts;
