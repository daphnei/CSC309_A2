var server = require("/update");

function trackBlog(response, request) {
    /* DEBUG */
    console.log("Tracking blog...");

    // TODO: Track a blog here.
}

function getBlogTrends(response, request) {
    /* DEBUG */
    console.log("Getting blog's liked posts...");

    // TODO: Send back liked posts from blog here.
}

function getAllTrends(response, request) {
    /* DEBUG */
    console.log("Getting all liked posts...");

    // TODO: Get all liked posts here.
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

exports.trackBlog = trackBlog;
exports.getBlogTrends = getBlogTrends;
exports.getAllTrends = getAllTrends;
exports.updateRequest = updateRequest;
