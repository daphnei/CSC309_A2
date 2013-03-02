/* database.js
 * Methods for accessing database information for this assignment.
 */
 
//will use this to prevent queries from overlapping
var mysql = require("mysql");
var queue =  require("./queue.js");

/**
* The error message that is through when connection to the database returns null.
**/
var DB_CONNECTION_ERROR = "Could not connect to the database.";

/**
 * A list of all of the table names. This will be iterated over to clear them. 
 */
var tables = new Array('updates', 'tracked_blogs','liked_posts', 'likes');

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
		throw DB_CONNECTION_ERROR;
		
	var queryText = "INSERT INTO liked_posts VALUES(" +
						connection.escape(url) + ", " +
						'NOW(), ' + 
						connection.escape(image) + ", " +
						connection.escape(text) + ", " +
						note_count + ", " +
						'0);';
	
	disconnect(connection);
	var item = new queue.Item(queryText, insertLikesRelation, [username, url]);
	console.log("The params in item are: " + item.actionParams);
	queryQ.enqueue(item);
	
	//if not already in the process of executing all queries in the 
	//queue, then start doing so
	if(!queriesExecuting) processQueryQueue();
	
	return true;
}

/** PRIVATE
*
* This is a helper function for insertLikedPost. It runs a second query that
* inserts a "likes" relationship into the likes table. 
**/
function insertLikesRelation(params) {
	var connection = connect();
	if (!connection) 
		throw DB_CONNECTION_ERROR;

	var liker = params[0];
	var post_url = params[1];

	var queryText = "INSERT INTO likes VALUES(" +
					connection.escape(liker) + ", " +
					connection.escape(post_url) + ");";

	disconnect(connection);
	var item = new queue.Item(queryText, null, null);
	queryQ.enqueue(item);

	//if not already in the process of executing all queries in the 
	//queue, then start doing so
	if(!queriesExecuting) processQueryQueue();
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
		throw DB_CONNECTION_ERROR;
		
	//find the total number of updates made so for this liked post
	var queryText = 'SELECT num_updates FROM liked_posts WHERE url = ' + 
		connection.escape(url) + ';';
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
		throw DB_CONNECTION_ERROR;
		
	// +1 from olde value, because we are in the process of making a new
	// update.
	var new_num = rows[0].num_updates + 1; 
	
	console.log("Should be updating the count for " + url + " to " + new_num);
	
	//next update the value of the total number of updates to reflect the
	//current update being done
	var queryText = 'UPDATE liked_posts SET num_updates=' + new_num + 
		' WHERE url =' + connection.escape(url) + ';';
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
		throw DB_CONNECTION_ERROR;
		
	queryText = "INSERT INTO updates VALUES(" +
					connection.escape(url) + ", " +
					"NOW(), " + 
					index + ", "  + 
					increment + ");";
	disconnect(connection);
	
	var item = new queue.Item(queryText, null, null); //thank god, no more functions to call
	queryQ.enqueue(item);
	if(!queriesExecuting) processQueryQueue();
}

/**
 * Returns posts in order by their increments in note_count in the last hour.
 * These will be returned in the JSON format described on the assignment 
 * webpage.
 * @param A function that will be called upon successfully generating JSON. 
 *        This function should take one argument, a JSON object
 */
function getTrendingPosts(callback) {
	//should actually be doing some sorts of fancy stuff here to sort the
	//posts by their popularity. This needs to be implemented.
	getLikedPostJSON(callback);
}

/** PRIVATE
* This is a helper function for getTrendingPosts. It gets the JSON info for all
* of the liked posts in the database. However, it does not fill in update
* information.
* @param the same callback that was passed to getTrendingPosts
**/
function getLikedPostJSON(callback) {
	var queryText = "select url, text, image, date  from liked_posts;";

	//this query does not need to be added to the queue since it does not change
	//anything in or rely on any changes in the database. Also, we are already
	//entering callback hell, no need to make it any worse.
	var connection = connect();
	if (!connection) 
		throw DB_CONNECTION_ERROR;

	connection.query(queryText, 
			function(err, rows, fields) {
				insertUpdateInfoJSON(rows, callback, 0);
			});

	disconnect(connection);
}

/** PRIVATE
* helper function for getTrendingPosts that gets all update information 
* from the database and adds it into the JSON
* 
* @param JSON containing info on each liked post
* @param the same callback that was passed to getTrendingPosts
**/
function insertUpdateInfoJSON(allData, callback, index) {
	//Got the update data for all of the liked posts. Can
	//return it now.
	if(index == allData.length) {
		callback(allData);
		return;
	}

	//again no need to do this query in the queue
	var connection = connect();
	if (!connection) 
		throw DB_CONNECTION_ERROR;

	var postData = allData[index];
	var queryText = "select time as timestamp, sequence_index as sequence," +
					"increment, (select sum(increment) from updates comp " +
					"where comp.url = cur.url and comp.increment >= cur.increment)" + 
					"as count from updates cur where cur.url = " +
					connection.escape(postData['url']) + ";";
	disconnect(connection);

	insertHelper(queryText, postData, function() {
		insertUpdateInfoJSON(allData, callback, index+1)
	});
}

function insertHelper(queryText, postData, callInsertAgain) {
	var connection = connect();
	if (!connection) 
		throw DB_CONNECTION_ERROR;

	connection.query(queryText, 
			function(err, rows, fields) {
				console.log("rows:");
				console.log(rows);

				//Is it safe to assume that the last row will be the one last in the
				//sequence? I will assume this for now. Otherwise we will need to
				//call some sort of max function
				postData['last_track'] = rows[rows.length-1]['date'];
				postData['last_count'] = rows[rows.length-1]['count'];

				postData['tracking'] = rows;

				callInsertAgain();
			});
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
		throw DB_CONNECTION_ERROR;
		
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
					else throw err;
				} else {
					console.log("Just executed: " + item.queryString);
					//console.log(rows);
				}
				
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
exports.getTrendingPosts = getTrendingPosts;
exports.getRecentPosts = getRecentPosts;
