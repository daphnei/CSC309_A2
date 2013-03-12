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

// update the database, getting any new liked posts
handles["/update"] = requestHandlers.updateRequest;


// Allow for command line switch to change database host
if(process.argv.length >= 4 && (process.argv[2] == "-h"
                            || process.argv[2] == "--host"))
{
    database.setHost(process.argv[3]);
}

/* Start the server */
server.start(router.route, handles);
