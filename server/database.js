/* database.js
 * Methods for accessing database information for this assignment.
 */
 
//will use this to prevent queries from overlapping
var mysql = require("mysql");
var queue =  require("./queue");
var updates = require("./updates")
/**
* The error message that is through when connection to the database returns null.
**/
var DB_CONNECTION_ERROR = "Could not connect to the database.";

/**
 * A list of all of the table names. This will be iterated over to clear them. 
 */
var tables = new Array('updates', 'tracked_blogs','liked_posts', 'likes');

// used to connect to the database
var options = {
		host: "dbsrv1.cdf.toronto.edu", // Default value, can be overridden by command-line option
		database: "csc309h_g1biggse",
		port: 3306,
		user: "g1biggse",
		password: "boorixae"
	};

var queryQ = new queue.Queue();
var queriesExecuting = false;

/**
 * Changes the database host to the specified location.
 *
 * @param newHost A string containing the new host address of the database.
 */
function setHost(newHost) {
    options.host = newHost;
}

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
 * Also, inserts an initial update for that post, using the given
 * note_count as the increment. 
 *
 * @param url The url of the post liked.
 * @param date The date of the post. Should be in the form: 'YYYY-MM-DD HH:MM'
 * @param username The username of the author of the post.
 * @param image An image used to describe the post. Null if post is imageless.
 * @param text The text of the post. Null if post has no text.
 * @param note_count How many notes have been made so far on the post.
 * 
 */
function insertLikedPost(url, date, username, image, text, note_count) {
	//This connection is only used so that escape can be called to check 
	//against sql injection. The actual querying of the database is done
	//by processQueryQueue
	var connection = connect();
	if (!connection) 
		throw DB_CONNECTION_ERROR;
		
	var queryText = "INSERT INTO liked_posts VALUES(" +
						connection.escape(url) + ", " +
						connection.escape(date) + ", " + 
						connection.escape(image) + ", " +
						connection.escape(text) + ", " +
						"0 , " + //there is a 0 here because the note_count will be added during updatePostPopularity
						'-1);';
	
	disconnect(connection);
	var item = new queue.Item(queryText, insertLikesRelation, [username, url]);
	queryQ.enqueue(item);
	
	//add an initial update so we don't have any undefined fields.
	updatePostPopularity(url, note_count);

	//if not already in the process of executing all queries in the 
	//queue, then start doing so
	if(!queriesExecuting) processQueryQueue();
	
	return true;
}

/** PRIVATE
 *
 * This is a helper function for insertLikedPost. It runs a second query that
 * inserts a "likes" relationship into the likes table.
 * @param params The paramaters of the query. 
 *               Should be an array of the form [liker, post_url].
 */
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
	var item = new queue.Item(queryText, function(blog_info, rows) {
							//once the blog has been inserted, insert its liked posts
							//need to check if rows is undefined for the case that the 
							//blog has already been inserted and a primary key constraint
							//is violated. In this case, rows will be undefined, and
							//should not do the update.
							if(rows!=undefined)
								updates.lookForNewLikedPosts(blog_info[0], blog_info[1])},
							[username, url]);
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
	var queryText = 'SELECT num_updates, note_count FROM liked_posts WHERE url = ' + 
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
	var oldNumUpdates = rows[0].num_updates;
	var oldNoteCount = rows[0].note_count;

	var connection = connect();
	if (!connection) 
		throw DB_CONNECTION_ERROR;
		
	// +1 from old value, because we are in the process of making a new
	// update.
	var newNumUpdates = rows[0].num_updates + 1; 
	//the new noteCount equals the old notecount plus the icnrement
	var	newNoteCount = oldNoteCount + increment;
	
	//next update the value of the total number of updates as well as the
	// value for the noteCount to reflect the changes
	var queryText = 'UPDATE liked_posts SET num_updates = ' + newNumUpdates + 
					 ', note_count = ' + newNoteCount +
					 ' WHERE url =' + connection.escape(url) + ';';
	disconnect(connection);

	//when this query is finished, we will still need the url, increment,
	//and newNumUpdates in order to make a new query to inser an Update
	//tuple
	var item = new queue.Item(queryText, insertUpdateTuple,
								[url, increment, newNumUpdates]);
	queryQ.enqueue(item);
	if(!queriesExecuting) processQueryQueue();
 }
 
/**  PRIVATE
 * A helper function for updatePostPopularity that creates a new updates
 * tuple with the new increment for a liked post. This function is not 
 * called directly, but rather called from a callback upon the successful
 * completion of a query.
 *
 * @param(params) a list consisting of [url, increment, update_index]
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
 * 
 * @param username The blogger usename whose liked posts we should be getting info for
 *        If passed null, will retrieve all liked posts by all bloggers
 * @param limit The limit on the number of posts that will be returned
 * @param callback A function that will be called upon successfully generating JSON. 
 *                 This function should take one argument, a JSON object
 **/
function getTrendingPosts(username, limit, callback) {
	//this method returns the data JSON in a callback
	getLikedPostJSON(username, limit, "trendy", function(data) {
		//by this point we have all the info we need from the server.
		//Just have to fancy it up and sort it so that it has the same format
		//that the prof wants.
		var final = {};

		final['trending'] = data;
		final['order'] = "Trending";
		final['limit'] = limit;

		//finaaaaaaaally can call the original provided callback with
		//these results
		callback(final);
	});
}

/**
 * Returns posts in the order they were made, from most recent to oldest.
 * These will be returned in the JSON format described on the 
 * assignment webpage.
 *
 * @param username The blogger usename whose liked posts we should be getting info for.
 *                 If passed null, will retrieve all liked posts by all bloggers
 * @param limit The limit on the number of posts that will be returned
 * @param callback A function that will be called upon successfully generating JSON. 
 *                 This function should take one argument, a JSON object
 */
function getRecentPosts(username, limit, callback)  {
	//this method returns the data JSON in a callback
	getLikedPostJSON(username, limit, "recent", function(data) {
		//by this point we have all the info we need from the server.
		//Just have to fancy it up and sort it so that it has the same format
		//that the prof wants.
		var final = {};

		//don't need to do any fancy sorting stuff here because data
		//already comes back sorted in order of date  

		final['trending'] = data;
		final['order'] = "Recent";
		final['limit'] = limit;

		//finaaaaaaaally can call the original provided callback with
		//these results
		callback(final);
	});
}

/** PRIVATE
* This is a helper function for getTrendingPosts. It gets the JSON info for all
* of the liked posts in the database. However, it does not fill in update
* information.
*
* @param username The owner of the blog whose liked posts to get.
* @param limit How many posts should be obtained at most.
* @param ordering The order in which to return the posts.
* @param callback A callback for when done getting all data
**/
function getLikedPostJSON(username, limit, ordering, callback) {
	var connection = connect();
	if (!connection) 
		throw DB_CONNECTION_ERROR;
	var queryText = "";
	if (ordering == "recent") {
		queryText = "select p.url, p.text, p.image, p.date " +
						"from liked_posts p ";
		// if no username is specified, don't look for posts liked by
		// specific blogger
		if (username != null)
			queryText += ", likes l where p.url = l.post_url and l.liker = " 
						+ connection.escape(username) + " ";
		queryText += "order by p.date desc limit " + limit + ";";
	}
	else if (ordering == "trendy") {
		queryText = "select p.url, p.text, p.image, p.date " +
						"from liked_posts p ";
		// if no username is specified, don't look for posts liked by
		// specific blogger
		if (username != null)
			queryText += ", likes l where p.url = l.post_url and l.liker = " 
						+ connection.escape(username) + " ";
		queryText += "order by (select max(increment) from updates u where " +
					 "u.url = p.url and u.sequence_index = p.num_updates) " +
					 "desc limit " + limit + ";";
	} else {
		throw new Error("The order parameter should either be 'trendy' or 'recent'");
	}
	//the query generate not need to be added to the queue since it does not change
	//anything in or rely on any changes in the database. Also, we are already
	//entering callback hell, no need to make it any worse.
	connection.query(queryText, 
			function(err, rows, fields) {
				if (err)
					throw err;

				console.log("Just executed: " + queryText);

				insertUpdateInfoJSON(rows, callback, 0);
			});

	disconnect(connection);
}

/** PRIVATE
* helper function for getTrendingPosts that recursively iterates through 
* all of the liked posts to get update information for each of them
* 
* @param allData JSON containing info on each liked post
* @param callback a callback for when done getting all data
* @param index an index that keeps track of our current position in the array
**/
function insertUpdateInfoJSON(allData, callback, index) {
	//finished getting the update data for all of the liked posts. 
	//Can return it now.
	if(index >= allData.length) {
		callback(allData);
		return;
	}

	//again no need to do this query in the queue
	var connection = connect();
	if (!connection) 
		throw DB_CONNECTION_ERROR;

	var postData = allData[index];
	var queryText = "select time as timestamp, sequence_index as sequence, " +
					"increment, (select sum(increment) from updates comp " +
					"where comp.url = cur.url and comp.sequence_index " + 
					"<= cur.sequence_index)" + 
					"as count from updates cur where cur.url = " +
					connection.escape(postData['url']) + 
					"order by sequence_index desc;";
	disconnect(connection);
	insertHelper(queryText, postData, function() {
		insertUpdateInfoJSON(allData, callback, index+1)
	});
}

/** PRIVATE
* A helper function for insertUpdateInfoJSON that is used to 
* ensure that the callback in the query is done in the correct
* namespace. This is the method where the updates information is
* actually inserted into the JSON.
*
* @param queryText the query to generate the update information for a
*        particular liked post 
* @param postData The JSON for a particular liked post. We will insert a
*        new field into it consisting of a list of updates.
* @param callInsertAgain reference to a function that calls 
*        insertUpdateInfoJSON with a one-higher index, so that we iterate
*        through all blogs.
**/
function insertHelper(queryText, postData, callInsertAgain) {
	var connection = connect();
	if (!connection) 
		throw DB_CONNECTION_ERROR;

	connection.query(queryText, 
			function(err, rows, fields) {
				if (err)
					throw err;

				console.log("Just executed: " + queryText);
				//this if statement handles the unlikely situation where a post has
				//not had any updates yet. This is more likely to come up in testing
				//than in reality, since we will always do an update first thing after
				//inserting a post.
				if (rows.length > 0) {
					postData['last_track'] = rows[rows.length-1]['timestamp'];
					postData['last_count'] = rows[rows.length-1]['count'];
				} else {
					postData['last_track'] = undefined;
					postData['last_count'] = undefined;
				}
				//we don't want to send out the last element in the sequence because it
				//is an initial update we did to track the note_count from when the liked
				//post was first inserted into the database. 
				rows.pop(); 
				postData['tracking'] = rows;

				callInsertAgain();
			});
	disconnect(connection);
}

/**
 * Checks if a blog is present in the tracked_blogs table by URL. 
 * 
 * @param base_hostname The base URL of the blog you want to check.
 * @param callback Function with param true if the URL exists, false otherwise
 **/
function checkIfBlogExists(base_hostname, callback) {
	var connection = connect();
	if (!connection) 
		throw DB_CONNECTION_ERROR;
		
	var queryText = "select count(url) as count from tracked_blogs where " +
					"url = " + connection.escape(base_hostname) + ";";
					
	connection.query(queryText,
					function(err, rows) {
						if (err)
							throw err;
						if(rows[0].count == 0) 
							callback(false);
						else
							callback(true);
					});

    disconnect(connection);
}

/**
 * Checks if a post is present in the liked_posts table by URL.
 * 
 * @param post_url The URL of the post that you want to check.
 * @param callback A function taking a single argument that will be set to
 * true if the post exists and false if not
 */
function checkIfPostExists(post_url, callback) {
    var connection = connect();
    if(!connection)
        throw DB_CONNECTION_ERROR;

	var queryText = "select count(url) as count from liked_posts where " +
					"url = " + connection.escape(post_url) + ";";
					
	connection.query(queryText,
					function(err, rows) {
						if (err)
							throw err;
						if(rows[0].count == 0) 
							callback(false);
						else
							callback(true);
					});

    disconnect(connection);
}

/**
 * Gets the posts urls for the posts liked by a single blog.
 * 
 * @param username The owner of the blog.
 * @param callback A function to run on the posts liked by the blog after they
 *                 have been retrieved.
 *
 **/
function getPostsLikedBy(username, callback) {
	var connection = connect();
    if(!connection)
        throw DB_CONNECTION_ERROR;
	var queryText = "select p.url, l.liker  from liked_posts p, likes l " + 
					"where p.url = l.post_url and l.liker = " +
					connection.escape(username) + ";";
	connection.query(queryText,
					function(err, rows) {
						if (err)
							throw err;
						callback(rows);
					});
	disconnect(connection);
}

/**
* Gets a list of the urls of all of the liked blogs. This will be used
* when every hour, the server checks to see if these bloggers have changed
* the posts they like.
*
* @param callback Callback that will be called once list is generated. Takes the
*        list of dictionaries with url and username
**/
function getTrackedBlogs(callback) {
	var queryText = "select url, username from tracked_blogs;";
	
	//using the wrapper so that the user of this function does not have to 
	//know about my ugly paramater structure.
	var callbackWrapper = function(noParams, rows) {
		var final = [];

		callback(rows);
	}
	var item = new queue.Item(queryText, callbackWrapper, null); 
	queryQ.enqueue(item);
	if(!queriesExecuting) processQueryQueue();
}

/**
 *  Returns a list of posts which have not been updates in the last "interval"
 *  minutes, 
 *  Note: the param for the callback is in the form:
 *  [ { url: 'thing.org', note_count: ### }, ... ]
 *
 * @param(interval) the minimum amount of time since the last update in minutes 
 * @param(callback) the function that will be called with the list of urls as
 *                   the parameter
 **/
function getPostsToUpdate(interval, callback) {
	//query that selects urls of posts that have not been updated in the 
	//last n minutes
	var queryText = "select u.url, p.note_count from " +
						"(select u1.url from updates u1 " +
						"where u1.sequence_index = " +
							"(select max(sequence_index) from updates u2 " +
							"where u2.url = u1.url) " +
							"and (u1.time + interval " + interval + " minute) <= " +
							"NOW()) u natural join liked_posts p;";
	var callbackWrapper = function(noParams, rows) {
		var final = [];
		
		callback(rows);
	}
	
	var item = new queue.Item(queryText, callbackWrapper, null); 
	queryQ.enqueue(item);
	if(!queriesExecuting) processQueryQueue();
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
exports.getTrackedBlogs = getTrackedBlogs;
exports.getPostsToUpdate = getPostsToUpdate;
exports.checkIfBlogExists = checkIfBlogExists;
exports.checkIfPostExists = checkIfPostExists;
exports.getPostsLikedBy = getPostsLikedBy;
exports.setHost = setHost;
exports.connect = connect; //this is temporary
