var http = require("http");
var url = require("url");
var database = require("./database");
var tumblr = require("./tumblr");

var cronJob = require("cron").CronJob;

var PORT = 31285;
// how often we should update our database with new information from Tumblr
// specified in cron syntax 
var INTERVAL_CRON = "*/2 * * * *";
var INTERVAL = 0; //interval length in minutes
function start(route, handles) {
    
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        route(handles, pathname, response, request);
    }

    http.createServer(onRequest).listen(PORT);
    console.log("Server has started at localhost on port " + PORT + ".");

    tumblr.getPostInfo("http:\/\/derekg.org\/post\/7431599279", function(info) {
        console.log("Got back a post with caption " + info.caption);
    });

    //do a preliminary update when the server starts up. 
    update();
    
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
	database.getPostsToUpdate(INTERVAL,
		function(urlTuples) {
            console.log("The posts to be updates: ");
            console.log(urlTuples);
			for (var i = 0; i < urlTuples.length; i++) {
                var url = urlTuples[i].url;
                var noteCount = urlTuples[i].note_count;
				//this is just a test insert. Really there should be a 
				//call to one of Alex's fancy methods here.
				database.updatePostPopularity(url, Math.floor(Math.random()*100));
			}
		});
}

exports.update = update;
exports.start = start;
