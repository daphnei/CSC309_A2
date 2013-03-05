var url = require('url');
var tumblr = require('./tumblr');
var database = require('./database');

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

    var parsed_url = url.parse(request.url, true);

    // Determine which order to send it in
    var query = parsed_url.query;

    if (!("order" in query) || (query.order != "Recent" && query.order != "Trending")) {
        // The "order" parameter is required.
        response.writeHead(400, {'Content-Type' : MIME_TYPES['.html']});
        response.end('Missing or invalid "order" parameter\n');
        return;
    }

    // Get the blog's hostname
    var base_hostname = parsed_url.pathname.match(/^\/?blog\/(.+)\/trends\/?$/)[1];

    // Callback function for later
    var responseSender = function(data, success) {
        if(success) {
            response.writeHead(200, {'Content-Type' : MIME_TYPES['.json']});
            response.end(JSON.stringify(data));
        }
        else {
            respond404(response);
        }
    }
    
    // Gather the data
    // TODO: We need a function to return liked posts of one particular blog.
    // Also need error checking for when asking about a blog that's not tracked. Need to spit
    // out a 404 error.
    // TODO: we need to implement the optional "limit" argument here in the internal functions,
    // then pass it in with parseInt(query.limit); or similar.
    if (query.order == "Trending") {
        // database.getBlogTrendingPosts(base_hostname, limit, responseSender);
        responseSender(JSON.stringify({trending : base_hostname}), true);
        // ^ For debug purposes if no db available
    }
    else if (query.order == "Recent") {
        // database.getBlogRecentPosts(base_hostname, limit, responseSender);
        responseSender(JSON.stringify({recent : base_hostname}), true);
        // ^ For debug purposes if no db available
    }
}


function getAllTrends(response, request) {
    // Only allow GETs.
    if (request.method != "GET") {
        respond404(response);
        return;
    }

    // Determine which order to send it in
    var query = url.parse(request.url, true).query;

    if (!("order" in query) || (query.order != "Recent" && query.order != "Trending")) {
        // The "order" parameter is required.
        response.writeHead(400, {'Content-Type' : MIME_TYPES['.html']});
        response.end('Missing or invalid "order" parameter\n');
        return;
    }

    // Callback function for later
    var responseSender = function(data) {
        response.writeHead(200, {'Content-Type' : MIME_TYPES['.json']});
        response.end(JSON.stringify(data));
    }
    
    // Gather the data
    // TODO: we need to implement the optional "limit" argument here in the internal functions,
    // then pass it in with parseInt(query.limit); or similar.
    if (query.order == "Trending") {
        database.getTrendingPosts(responseSender);
        //responseSender("{'stuff':'trending'}"); // For debug purposes if no db available
    }
    else if (query.order == "Recent") {
        database.getRecentPosts(responseSender);
        //responseSender("{'stuff':'recent'}"); // For debug purposes if no db available
    }
}

/**
* Have a request that updates the server is for 
* testing purposes only. Under normal circumstances,
* server.update is automatically called every n minutes.
*
**/
function updateRequest(response, request) {
    /* DEBUG */
    console.log("Updating the database...");

    server.update();
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
exports.updateRequest = updateRequest;
exports.respond404 = respond404;
