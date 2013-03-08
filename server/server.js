var http = require("http");
var url = require("url");
var database = require("./database");
var tumblr = require("./tumblr");
var mail = require("./mail");

var cronJob = require("cron").CronJob;

var PORT = 31285;
// how often we should update our database with new information from Tumblr
// specified in cron syntax 
var INTERVAL_CRON = "*/2 * * * *";
var POST_UPDATE_INTERVAL = 0; //interval length in minutes
function start(route, handles) {
    
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        route(handles, pathname, response, request);
    }

    http.createServer(onRequest).listen(PORT);
    console.log("Server has started at localhost on port " + PORT + ".");

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
	database.getPostsToUpdate(POST_UPDATE_INTERVAL,
		function(urlTuples) {
            console.log("The posts to be updated: ");
            console.log(urlTuples);
			for (var i = 0; i < urlTuples.length; i++) {
                var url = urlTuples[i].url;
                var oldNoteCount = urlTuples[i].note_count;
				tumblr.getNoteCountIncrement(url, oldNoteCount,
							function(increment) {
								database.updatePostPopularity(url, increment);
							});
			}
		});
}

// send error report to admins when the server crashes
process.on("uncaughtException", function(err) {
    
    console.log("Server crashed with following error: ");
    console.log(err);

    mail.sendErrorReport(err, function() {
        // don't keep the server running after we finish sending the report
        process.exit();
    });   
});

exports.update = update;
exports.start = start;
