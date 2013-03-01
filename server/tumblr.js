/* tumblr.js
 * Abstracts access to the Tumblr API for easy usage.
 */

var helper = require("./helper");
var http = require("http");

// API key and urls, required to query data
var KEY = "U7b58PCbU1oK7OEZSKfopbzxoJimPTGVXi1hhG0i5uwtVugvWj";
var API = "api.tumblr.com";
var BLOG_API = "/v2/blog/";
var USER_API = "/v2/user/";

/**
 * Gets all the liked posts by a blog.
 *
 * @param blogURL The URL of the blog whose liked posts to get.
 * @param onFinished A function to run when the posts have been retrieved.
 *                   Should take the liked posts, as an array of JSON
 *                   objects, as a parameter.
 */
function getLikedPosts(blogURL, onFinished) {
    // we need to get the number of likes the blog has before we can get all
    // of them, since Tumblr limits the number you get back to 20 by default.
    getInfo(blogURL, function(info) {
        var numLikes = info.likes;
        var requestURL = BLOG_API + blogURL + "/likes";
        var method = "GET";

        // also, if we request more than about 50 posts, Tumblr defaults
        // back to giving 20, so request them in batches of 20
        var posts = new Array();

        // figure out how many requests we need to make so we can figure out
        // when we've got all the posts despite asynchronous behavior.
        var numRequests = Math.ceil(numLikes / 20.0);
        var numFinished = 0;
        for (var offset = 0; offset < numLikes; offset += 20) {
            var params = {
                limit: 20,
                offset: offset
            };
            
            requestedPosts = true;
            makeAPIRequest(requestURL, method, params, function(res) {
                if (success(res)) {
                    var receivedPosts = res.response.liked_posts;
                    posts = posts.concat(receivedPosts);
                    numFinished++;
                    
                    // once all the requests are done, we should hopefully have
                    // all of, or enough of, the liked posts. Run the callback.
                    if (numFinished === numRequests) {
                        onFinished(posts);
                    }
                }
            }.bind(this));
        }
    });

}

/**
 * Gets the owner of a blog by its url.
 * 
 * @param blogURL The blog whose owner to get.
 * @param onFinished A function to run when the user has been retrieved.
 *                   Should take the username, as a string, as a parameter.
 */
function getUser(blogURL, onFinished) {
    getInfo(blogURL, function(info) {
        var user = info.name;
        onFinished(user);
    });
}

/**
 * Gets info on a blog by its url.
 *
 * @param blogURL The blog to retrieve information about.
 * @param onFinished A function to run when the info has been retrieved.
 *                   Should take the info, as a JSON object, as a parameter.
 */
function getInfo(blogURL, onFinished) {
    var requestURL = BLOG_API + blogURL + "/info";
    var method = "GET";
    var params = {};

    makeAPIRequest(requestURL, method, params, function(response) {
        if (success(response)) {
            var info = response.response.blog;
            onFinished(info);
        }
    });
}

/**
 * Return whether or not the Tumblr API call was successful.
 *
 * @param response The response from the Tumblr API call, as a JSON object.
 *
 * @returns True if the call was successful, false otherwise.
 */
function success(response) {
    var meta = response.meta;
    var status, msg;
    if (meta !== undefined) {
        status = response.meta.status;
        msg = response.meta.msg;
    }

    if (msg != "OK") {
        console.log("Tumblr API call failed: (" + status +") " + msg);
        return false;
    }
    else {
        return true;
    }
}

/**
 * Make a request to the Tumblr API.
 *
 * @param url The path from api.tumblr.com to make the request to.
 * @param method The method of the request.
 * @param params The parameters of the request. Doesn't need to include the
 *               api_key.
 * @param onFinished A callback to perform when the request finishes running.
 *                   Should take the server's JSON response as a single 
 *                   parameter.
 * @param needsKey Whether or not this request requires the API key.
 *                 True by default.
 */
function makeAPIRequest(url, method, params, onFinished, needsKey) {
    
    // by default, we probably need the API key.
    needsKey = (typeof needsKey !== "undefined" ? needsKey : true);

    // only give the API key if this request needs it.
    if (needsKey) {
        params.api_key = KEY;
    }

    // convert to a string in the form "param1=value1&param2=value2&..."
    params = helper.asURLParams(params);

    /* DEBUG */
    console.log("Making API request with URL: " + API + url + "?" + params);
    
    // setup request
    var options = {
        host: API,
        // path needs params, but don't bother adding them if we don't have any
        path: url + (params !== "" ? ("?" + params) : ""),
        method: method
    };

    var request = http.request(options, function(res) {
        
        var response = "";

        // receiving data back from Tumblr
        res.on("data", function(chunk) {
            //console.log(chunk.toString());
            response += chunk.toString();
        }.bind(this)); // access to local variables within callback scope

        // received all data
        res.on("end", function() {
            console.log("Finished");
            onFinished(JSON.parse(response));
        }.bind(this));
    });

    request.on("error", function(e) {
        console.log("Problem with request: " + e.message);
    });

    request.end();
}

exports.getInfo = getInfo;
exports.getUser = getUser;
exports.getLikedPosts = getLikedPosts;
