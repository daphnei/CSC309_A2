var http = require("http");
var url = require("url");
var database = require("./database");
var tumblr = require("./tumblr");
var mail = require("./mail");

var cronJob = require("cron").CronJob;

var PORT = 31285;
// how often we should update our database with new information from Tumblr
// specified in cron syntax 
var INTERVAL_CRON = "*/5 * * * *";
var POST_UPDATE_INTERVAL = 60; //interval length in minutes
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

/**
 * Runs a full update of the service.
 */
function update() {
    
    // Add any new liked posts first.
    // Get all our blogs
    database.getBlogUrls(function (blogs) {
        for (var i=0; i < blogs.length; i++) {
            // WARNING: this may be slow, as it requests ALL the liked posts of a blog and
            // runs through them.
            // Get the blogs' liked posts
            tumblr.getLikedPosts(blogs[i], function(posts) {
                for (var j=0; j < posts.length; j++) {
                    // Check whether each of the posts is in our database already
                    database.checkIfPostExists(posts[j].post_url, function (exists) {
                        // Only add the posts that exist.
                        if(!exists) {
                            tumblr.getUser(blogs[i], function (username) {
                                // NOT ENOUGH CALLBACKS
                                
                                var post_photo = (("photos" in posts[j])
                                                ? posts[j].photos.original_size.url : null);
                                var post_text = (("title" in posts[j]) ? posts[j].title : null);

                                database.insertLikedPost(posts[j].post_url, username, post_photo,
                                    post_text, posts[j].note_count);
                            });
                        }
                    });
                }
            });
        }
    });

    // And update existing ones.
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
