/* index.js
 * The starting point of the backend. Run this to start the server.
 */

var server = require('./server');
var router = require('./router');
var database = require('./database');
var requestHandlers = require('./requestHandlers');

// now using regex for handle paths
var handles = {}

/* the main pages of the REST api */

// start tracking a blog
handles["/blog"] = requestHandlers.trackBlog;

// get trendy posts liked by a specific blog
handles["/blog/(.+)/trends"] = requestHandlers.getBlogTrends;
        
// get trendy posts across all tracked blogs
handles["/blogs/trends"] = requestHandlers.getAllTrends;

/* DEBUG HANDLES -- REMOVE THESE BEFORE SUBMISSION */

// update the database, getting any new liked posts
handles["/update"] = requestHandlers.update;

/* Start the server */
server.start(router.route, handles);
