url = require('url');
tumblr = require('./tumblr');
database = require('./database');

MIME_TYPES = {
		'.html': 'text/html',
		'.css': 'text/css',
		'.js': 'text/javascript',
		'.txt': 'text/plain',
		'.json': 'application/json',
		'.ico' : 'image/vnd.microsoft.icon'
};


function trackBlog(response, request) {
    // Only allow POSTs.
    if (request.method != "POST") {
        respond404(response);
        return;
    }
    
    var query = url.parse(request.url, true).query;

    if (!("blog" in query)) {
        // They forgot the "?blog=whatever.tumblr.com" parameter in the URL.
        response.writeHead(400, {'Content-Type' : MIME_TYPES['.html']});
        response.end('Missing "blog" parameter\n');
        return;
    }
    
    // Note: We don't notify the client whether a blog exists at this point. If they try to
    // request data from a non-existent blog, though, we should return 404.
    // This is the behaviour specified in the latest notes on the assignment spec.
    tumblr.getUser(query.blog, function(username) {
        database.insertNewBlog(query.blog, username);
    });

    response.writeHead(200);
    response.end();
}


function getBlogTrends(response, request) {
    // Only allow GETs.
    if (request.method != "GET") {
        respond404(response);
        return;
    }

    /* DEBUG */
    console.log("Getting blog's liked posts...");

    // TODO: Get all posts liked by the particular blog. 
}


function getAllTrends(response, request) {
    // Only allow GETs.
    if (request.method != "GET") {
        respond404(response);
        return;
    }

    // Determine which order to send it in
    var query = url.parse(request.url, true).query;

    if (!("order" in query)) {
        // The "order" parameter is required.
        response.writeHead(400, {'Content-Type' : MIME_TYPES['.html']});
        response.end('Missing "order" parameter\n');
        return;
    }
    
    // Gather the data
    

    // Send the response
    
}


function update(response, request) {
    /* DEBUG */
    console.log("Updating the database...");

    // TODO: Update the database here.
}


/**
 * Sends an HTTP response with a generic 404 message.
 *
 * @param response The response which you want to send off with a 404.
 */
function respond404(response) {
    response.writeHead(404, {'Content-Type' : MIME_TYPES['.html']});
    response.end("404: Not found\n"); 
}


exports.trackBlog = trackBlog;
exports.getBlogTrends = getBlogTrends;
exports.getAllTrends = getAllTrends;
exports.update = update;
exports.respond404 = respond404;
