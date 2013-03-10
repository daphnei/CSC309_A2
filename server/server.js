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
    addAllNewLikedPosts();
    updateAllPosts();
}

function addAllNewLikedPosts() {

    // go through each blog's liked posts and search for new entries
    database.getBlogUrls(function (blogs) {
        for (var i=0; i < blogs.length; i++) {
            // WARNING: this may be slow, as it requests ALL the liked posts of a blog and
            // runs through them.
            
            // Get the blogs' liked posts
            addNewPosts(blogs[i]);
        }
    });
}

function addNewPosts(blog) {
    tumblr.getLikedPosts(blog, function(posts) {
        for (var j=0; j < posts.length; j++) {

            // Check whether each of the posts is in our database already
            var curPost = posts[j];
            addIfNew(posts[j], blog);
        }
    }.bind(this));
}

function addIfNew(post, blog) {
    database.checkIfPostExists(post.post_url, function (exists) {
        // Only add tuples for the posts that do not exist yet.
        if (!exists) {
            tumblr.getUser(blog, function (username) {
                // NOT ENOUGH CALLBACKS
                
                // if there are photos in the image, use the
                // first one at original size for the post
                // photo.
                var post_photo = (("photos" in post)
                                ? post.photos[0].alt_sizes[0].url : null);
                var post_text = (("title" in post) ? post.title : null);

                database.insertLikedPost(post.post_url, post.date, username, post_photo,
                    post_text, post.note_count);
            }.bind(this));
        }
    }.bind(this));

}

function updateAllPosts() {
    database.getPostsToUpdate(POST_UPDATE_INTERVAL,	function(urlTuples) {
        console.log("The posts to be updated: ");
        console.log(urlTuples);
        for (var i = 0; i < urlTuples.length; i++) {
            var url = urlTuples[i].url;
            var oldNoteCount = urlTuples[i].note_count;
            tumblr.getNoteCountIncrement(url, oldNoteCount, function(increment) {
                database.updatePostPopularity(url, increment);
            });
        }
    });
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

exports.update = update;
exports.start = start;
