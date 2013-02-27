/* database.js
 * Methods for accessing database information for this assignment.
 */
 
//will use this to prevent queries from overlapping
var mysql = require("mysql");
var queue =  require("./queue.js");

/**
 * A constant representing the quote string
 **/
var QUOTE = "'";

/**
 * A list of all of the table names. This will be iterated over to clear them. 
 */
var tables = new Array('updates', 'tracked_blogs','liked_posts');

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

var queryQ = new queue.Queue();
var queriesExecuting = false;
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
 */
function insertLikedPost(url, username, image, text, note_count) {
	//This connection is only used so that escape can be called to check 
	//against sql injection. The actual querying of the database is done
	//by processQueryQueue
	var connection = connect();
	if (!connection) 
		throw "Could not connect to the database."
		
	var queryText = "INSERT INTO liked_posts VALUES(" +
						connection.escape(url) + ", " +
						connection.escape(username) + ", " +
						'CURTIME(), ' + 
						connection.escape(image) + ", " +
						connection.escape(text) + ", " +
						note_count + ", " +
						'0);';

	disconnect(connection);
	var item = new queue.Item(queryText, null, null);
	queryQ.enqueue(item);
	
	//if not already in the process of executing all queries in the 
	//queue, then start doing so
	if(!queriesExecuting) processQueryQueue();
	
	return true;
}

/**
 * Inserts a new blog to be tracked.
 *
 * @param url The url of the blog.
 * @param username The username of the owner of the blog.
 * 
 */
function insertNewBlog(url, username) {
	//This connect is only used so that escape can be called to check 
	//against sql injection. The actual querying of the datavase is done
	//by processQueryQueue
	var connection = connect();
	if (!connection) 
		return false;	
	var queryText = "INSERT INTO tracked_blogs VALUES(" +
						connection.escape(url)  + "," +
						connection.escape(username) + ");";
	disconnect(connection);
	var item = new queue.Item(queryText, null, null);
	queryQ.enqueue(item);
	
	//if not already in the process of executing all queries in the 
	//queue, then start doing so
	if(!queriesExecuting) processQueryQueue();
}

/**
 * Makes an update to the popularity of a post.
 *
 * There are three steps:
 * 1) Find the number of updates that have been done so far on a given 
 *    liked post.
 * 2) Increment the value for the number of updates that have been done 
 *    on that post.
 * 3) Add a new tuple to updates with this information.
 * 
 * @param url The url of the post.
 * @param increment How much the post's popularity(note count) has increased
 *				  since the last update.
 * 
 */
function updatePostPopularity(url, increment) {
	var connection = connect();
	if (!connection) 
		throw "Could not connect to the database."
		
	//find the total number of updates made so for this liked post
	var queryText = 'SELECT num_updates FROM liked_posts WHERE url == ' + 
		QUOTE + connection.escape(url) + QUOTE + ';';
	
	disconnect(connection);
	
	//when the query for this item has finished, incrementNumUpdates will
	//be called with [url, increment] as its parameter.
	var item = new queue.Item(queryText, incrementNumUpdates, [url, increment]);
	queryQ.enqueue(item);
	
	if(!queriesExecuting) processQueryQueue();
}

/**  PRIVATE
 * A helper function for updatePostPopularity that increments num_updates
 * for a liked post. This function is not called directly, but rather 
 * called from a callback upon the successful completion of a query.
 * 
 * @param(params) a list conststing of [url, increment]
 * @params(rows) the rows returned by the query that this method was called for
 **/
 function incrementNumUpdates(params, rows) {
	var url = params[0];
	var increment = params[1];
	
	var connection = connect();
	if (!connection) 
		throw "Could not connect to the database."
		
	// +1 from olde value, because we are in the process of making a new
	// update.
	var new_num = rows[0].num_updates + 1; 
	
	//next update the value of the total number of updates to reflect the
	//current update being done
	var queryText = 'UPDATE liked_posts SET num_updates=' + new_num + 
		'WHERE url ==' + connection.escape(url) + ';';
	disconnect(connection);
		
	var item = new queue.Item(queryText, insertUpdateTuple,
								[url, increment, new_num]);
	queryQ.enqueue(item);
	if(!queriesExecuting) processQueryQueue();
 }
 
/**  PRIVATE
 * A helper function for updatePostPopularity that creates a new updates
 * tuple with the new increment for a liked post. This function is not 
 * called directly, but rather called from a callback upon the successful
 * completion of a query.
 * @param(params) a list conststing of [url, increment, update_index]
 **/
function insertUpdateTuple(params) {	
	var url = params[0];
	var increment = params[1];
	var index = params[2];
	
	var connection = connect();
	if (!connection) 
		throw "Could not connect to the database."
		
	queryText = "INSERT INTO updates VALUES(" +
					connection.escape(url) + ", " +
					"CURTIME(), " + 
					index + ", "  + 
					increment + ");";
	disconnect(connection);
	
	var item = new queue.Item(queryText, null, null); //thank god, no more functions to call
	queryQ.enqueue(item);
	if(!queriesExecuting) processQueryQueue();
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
 */
function clearTables() {
	for (var i = 0; i < tables.length; i++) {
		var item = new queue.Item("TRUNCATE TABLE " + tables[i] + ";", null, null);
		queryQ.enqueue(item);
	}

	//if not already in the process of executiving all queries in the 
	//queue, then start doing so
	if(!queriesExecuting) processQueryQueue();
}


/**
 * A method that recursively goes through all queries in the queue and
 * executes them in order, by only starting execution of the next one
 * once the current one is finished executing.
 **/
function processQueryQueue() {	
	queriesExecuting = true;
	
	var connection = connect();
	if (!connection)
		throw "Could not connect to the database."
		
	if (queryQ.getLength() > 0) {
		var currentQueryItem = queryQ.dequeue();
		
		//need to do this in a seperate function for namespace issues
		//if we don't do this, it will be impossible to know what query
		//has just been executed when the callback function is reached
		sendQuery(connection, currentQueryItem);
	} else {
		//no more queries to execute for now, so no more levels of recursion
		//for now
		queriesExecuting = false;
	}

	disconnect(connection);
}

/**
 * A helper method for processQueryQueue. This is needed so that we can
 * print out what query just finished executing, once it is done.
 * 
 * @param(connection) the connection to the database
 * @param(queryString) the query to be executed
 **/
function sendQuery(connection, item) {
	connection.query(item.queryString, 
			function(err, rows, fields) {
				if (err) {
					if(err.code == 'ER_DUP_ENTRY') 
						console.log("WARNING: The query '" + item.queryString +
									"' was not executed because it violates a primary key constraint.");
				}
				else console.log("Just executed: " + item.queryString);
				
				//do whatever action was passed in
				if (item.action != null) {
					item.action(item.actionParams, rows, fields);
				}
				
				//process the next query in the queue
				processQueryQueue();
			});
}

exports.clearTables = clearTables;
exports.insertLikedPost = insertLikedPost;
exports.insertNewBlog = insertNewBlog;
exports.updatePostPopularity = updatePostPopularity;
exports.getPostPopularity = getPostPopularity;
exports.getTrendingPosts = getTrendingPosts;
exports.getRecentPosts = getRecentPosts;
