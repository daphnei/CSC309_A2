var database = require("./database");
var tumblr = require("./tumblr");

// how many minutes between getting new updates for post note counts
POST_UPDATE_INTERVAL = 5;

/**
* If not given a param, goes through each tracked blog's liked posts to see if 
* there are any newly liked posts that need to be added to the database. If
* given a parameter, only goes through the liked posts of the specified blog.
*
* @param username An optional parameter. The url of a blog whose 
*                 liked posts are the only ones we should go through.
**/
function lookForNewLikedPosts(url) {
	if (url != undefined) {
		addNewPosts(url);
	} else {
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
}

/** PRIVATE
*
* helper function for lookForNewLikedPosts, iterates through all posts
* liked by a tracked blogger
*
*@param blog the url of the blog to find liked posts for
**/
function addNewPosts(blog) {
    tumblr.getLikedPosts(blog, function(posts) {
        for (var j=0; j < posts.length; j++) {

            // Check whether each of the posts is in our database already
            var curPost = posts[j];
            addIfNew(posts[j], blog);
        }
    }.bind(this));
}

/** PRIVATE
*
* helper function for lookForNewLikedPosts, checks if a post is already in
* the database, and if it is not, add it.
*
*@param blog the url of the blog of the liked post
*@param post the url of the post that may or may not get added to database
**/
function addIfNew(post, blog) {
    database.checkIfPostExists(post.post_url, function (exists) {
        // Only add tuples for the posts that do not exist yet.
        if (!exists) {
            tumblr.getUser(blog, function (username) {
                
                var post_photo = "";
                var post_text = "";

                // Handle each type of post differently
                switch(post.type) {
                    case "text":
                        post_text = post.body;
                        break;
                    case "photo":
                        // if there are photos in the image, use the
                        // first one at original size for the post
                        // photo.
                        post_photo = post.photos[0].original_size.url;
                        post_text = post.caption;
                        break;
                    case "quote":
                        post_text = post.text;
                        break;
                    case "link":
                        post_text = post.description;
                        break;
                    case "chat":
                        post_text = post.body;
                        break;
                    case "audio":
                    case "video":
                        post_text = post.caption;
                        break;
                    case "answer":
                        post_text = post.question;
                        break;
                }

                database.insertLikedPost(post.post_url, post.date, username, post_photo,
                    post_text, post.note_count);
            }.bind(this));
        }
    }.bind(this));

}

/**
* For each liked post in the database, will check if it has not been updated
* in the last POST_UPDATE_INTERVAL minutes, and update its note count if need be
**/
function recordNewNoteCounts() {
    database.getPostsToUpdate(POST_UPDATE_INTERVAL,	function(urlTuples) {
        console.log("The posts to be updated: ");
        console.log(urlTuples);
        for (var i = 0; i < urlTuples.length; i++) {
            var url = urlTuples[i].url;
            var oldNoteCount = urlTuples[i].note_count;
            updateNoteCount(url, oldNoteCount);
        }
    });
}

/** PRIVATE
* A helper function for recordNewNoteCounts that does the actually call to the 
* database function, after tumblr has returned the new note count for a post.
*
* @param url The url of the liked post being checked for new note count
* @param oldNoteCount The old note count for that post. Needed in order to 
*                     calculate the increment.
**/
function updateNoteCount(url, oldNoteCount) {
    tumblr.getNoteCountIncrement(url, oldNoteCount, function(increment) {
        database.updatePostPopularity(url, increment);
    });
}

exports.recordNewNoteCounts = recordNewNoteCounts;
exports.lookForNewLikedPosts = lookForNewLikedPosts;
