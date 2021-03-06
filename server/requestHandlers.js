var url = require('url');
var querystring = require('querystring');
var tumblr = require('./tumblr');
var database = require('./database');
var helper = require('./helper');
var server = require('./server');

MIME_TYPES = {
		'.html': 'text/html',
		'.css': 'text/css',
		'.js': 'text/javascript',
		'.txt': 'text/plain',
		'.json': 'application/json',
		'.ico' : 'image/vnd.microsoft.icon'
};

/**
 * Handler to make the server track a new blog.
 * Responds with 200 if the call was valid, 404 if invalid.
 *
 * @param response The server's response to the client.
 * @param request The client's request to the server.
 */
function trackBlog(response, request) {
    // Only allow POSTs.
    if (request.method != "POST") {
        respond404(response);
        return;
    }

    var body = '';

    // Wait for the post data
    request.on('data', function (data) {
        body += data;
    });

    // Once the request is done, process it.
    request.on('end', function () {
        console.log("Processing blog with query " + body);
        var query = querystring.parse(body);

        if (!("blog" in query)) {
            // They forgot the "blog=whatever.tumblr.com" parameter in the query.
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
    });
}

/**
 * Get the trending posts liked by a specific blog.
 * Responds with a JSON object representing those trending posts.
 *
 * @param response The server's response to the client.
 * @param request The client's request to the server.
 */
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

    var base_hostname = parsed_url.pathname.match(/^\/?blog\/(.+)\/trends\/?$/)[1];
    
    // Callback function for later
    var responseSender = function(data) {
        if (data == null) {
            respond404(response);
        } else {
            response.writeHead(200, {'Content-Type' : MIME_TYPES['.json']});
            response.end(JSON.stringify(data, null, 4));
        }
    };

    var limit = ("limit" in query ? query.limit : 20);

    // Check whether the blog exists in our database first
    database.checkIfBlogExists(base_hostname, function (exists) {
        if(!exists) respond404(response);        

        // Gather the data if it does exist
        if (query.order == "Trending") {
            tumblr.getUser(base_hostname, function(username) {
                database.getTrendingPosts(username, limit, responseSender);
            });
        }
        else if (query.order == "Recent") {
            tumblr.getUser(base_hostname, function(username) {
                database.getRecentPosts(username, limit, responseSender);
            });
        }
    });

}

/**
 * Handle for getting trending posts from all blogs.
 * Responds with a JSON object representing all the post data.
 *
 * @param response The server's response to the client.
 * @param request The client's request to the server.
 */
function getAllTrends(response, request) {
    // Only allow GETs.
    if (request.method != "GET") {
        respond404(response);
        return;
    }

    // Determine which order to send it in
    var query = url.parse(request.url, true).query;
    
    // make sure the order parameter is defined and valid
    if (!("order" in query) || (query.order != "Recent" && query.order != "Trending")) {
        // The "order" parameter is required.
        response.writeHead(400, {'Content-Type' : MIME_TYPES['.html']});
        response.end('Missing or invalid "order" parameter\n');
        return;
    }

    // Callback function for later
    var responseSender = function(data) {
		if (data == null) {
			respond404(response);
		} else {
			response.writeHead(200, {'Content-Type' : MIME_TYPES['.json']});
			response.end(JSON.stringify(data, null, 4));
		}
    }
    
    var limit = ("limit" in query ? query.limit : 20);

    // Gather the data
    if (query.order == "Trending") {
        database.getTrendingPosts(null, limit, responseSender);
    }
    else if (query.order == "Recent") {
        database.getRecentPosts(null, limit, responseSender);
    }
}

/**
 * Have a request that updates the server is for 
 * testing purposes only. Under normal circumstances,
 * server.update is automatically called every n minutes.
 * 
 * @param response The server's response to the client.
 * @param request The client's request to the server.
 **/
function updateRequest(response, request) {
    server.update();
    response.writeHead(200, {'Content-Type' : MIME_TYPES['.json']});
    response.end();
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
