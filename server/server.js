var http = require("http");
var url = require("url");
var database = require("./database");
var tumblr = require("./tumblr");

var cronJob = require("cron").CronJob;

var PORT = 31285;
// how often we should update our database with new information from Tumblr
// specified in cron syntax 
var INTERVAL_CRON = "00 * * * * *";
var INTERVAL = 1; //interval length in minutes
function start(route, handles) {
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        route(handles, pathname, response, request);
    }

    http.createServer(onRequest).listen(PORT);
    console.log("Server has started at localhost on port " + PORT + ".");

    /*
    var info = tumblr.getLikedPosts("sillygwailo.tumblr.com", function(likes) {
        console.log("Received " + likes.length + " liked posts from Tumblr.");
    });
    */

    // update the info on the tracked blogs every so often
    var job = new cronJob({
        cronTime: INTERVAL_CRON,
        onTick: function() {
            console.log("Doing an update!");
            update();
        },
        start: true,
        timeZone: "EST"
    });
}

function update() {
	
}

exports.update = update;
exports.start = start;
