var http = require("http");
var url = require("url");
var database = require("./database");
var tumblr = require("./tumblr");
var mail = require("./mail");
var updates = require("./updates");
var cronJob = require("cron").CronJob;

var PORT = 31285;

// how often we should update our database with new information from Tumblr.
// Value is specified in cron syntax 
var INTERVAL_CRON = "*/5 * * * *";

/**
 * Start the server.
 *
 * @param route A function to route requests to their proper request handlers.
 * @param handles A map of request handlers to request path regular expressions.
 */
function start(route, handles) {
    
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        route(handles, pathname, response, request);
    }

    http.createServer(onRequest).listen(PORT);
    console.log("Server has started at localhost on port " + PORT + ".");

    //do a preliminary update when the server starts up to see if there are
    //any new posts that have been liked by the bloggers in the database.
    updates.lookForNewLikedPosts();
    
    // update the info on the tracked blogs every so often
    var job = new cronJob({
        cronTime: INTERVAL_CRON,
        onTick: function() {
            update()
        },
        start: true,
        timeZone: "EST"
    });
}

/**
 * Function called every few minutes to update database with new liked posts,
 * and get note count increments for existing posts.
 */
function update() {
    updates.recordNewNoteCounts();
    updates.lookForNewLikedPosts();
}


// send error report to admins when the server crashes
process.on("uncaughtException", function(err) {
    
    console.log("Server crashed with following error: ");
    console.log(err);
    console.log("Stacktrace:");
    console.log(err.stack);

    mail.sendErrorReport(err, function() {
        // don't keep the server running after we finish sending the report
        process.exit();
    });   
});

exports.start = start;
exports.update = update;
