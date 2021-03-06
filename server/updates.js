var database = require("./database");
var tumblr = require("./tumblr");

// how many minutes between getting new updates for post note counts
POST_UPDATE_INTERVAL = 60;

/**
* If not given a param, goes through each tracked blog's liked posts to see if 
* there are any newly liked posts that need to be added to the database. If
* given a parameter, only goes through the liked posts of the specified blog.
*
* @param blogger An optional parameter. The username whose 
*                liked posts are the only ones we should go through.
* @param url The url of the blogger's blog, if specified.
**/
function lookForNewLikedPosts(blogger, url) {
	if (blogger != undefined) {
        // go through specific blogger's liked posts and search for new entries
		addNewPosts(blogger, url);
	} else {
	    // go through each blogger in DB's liked posts and search for new entries
	    database.getTrackedBlogs(function (blogs) {
	        for (var i=0; i < blogs.length; i++) {
	            // WARNING: this may be slow, as it requests ALL the liked posts of a blog and
	            // runs through them.
	            
	            // Get the blogs' liked posts
	            addNewPosts(blogs[i].username, blogs[i].url);
	        }
	    });
	}
}

/** PRIVATE
*
* helper function for lookForNewLikedPosts, iterates through all posts
* liked by a tracked blogger
*
* @param blogger The name of the blogger to find liked posts for
* @param url The url of the blogger's blog.
**/
function addNewPosts(blogger, url) {
    tumblr.getLikedPosts(url, function(newLikedPosts) {
		database.getPostsLikedBy(blogger, function(currentLikedPosts) {
			addIfNew(blogger, currentLikedPosts, newLikedPosts);
		})
    });
}

/** PRIVATE
*
* helper function for lookForNewLikedPosts, checks if a post is already in
* the database, and if it is not, add it.
*
* @param username The username of the blogger whose liked posts we are going through
* @param currentLikedPosts list of liked posts already in the database
* @param newLikedPosts list of liked posts retrieved from Tumblr
**/
function addIfNew(username, currentLikedPosts, newLikedPosts) {
    for (var i = 0; i < newLikedPosts.length; i++) {
		var post = newLikedPosts[i];
		if(!containsPost(currentLikedPosts, post)) {
        // Only add tuples for the posts that do not exist yet.                
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
        } 
    }

}

/**
 * Checks whether or not the given post is contained within the current liked
 * posts of a blog.
 *
 * @param currentLikedPosts All the posts that are currently liked by a blog.
 * @param post The post to check.
 *
 * @returns True if post is contained in currentLikedPosts, false otherwise.
 */
function containsPost(currentLikedPosts, post) {
    current_urls = currentLikedPosts.map(function(item) { return item.url; });
    return current_urls.indexOf(post.post_url) != -1;
}

/**
* For each liked post in the database, will check if it has not been updated
* in the last POST_UPDATE_INTERVAL minutes, and update its note count if need be
**/
function recordNewNoteCounts() {
    database.getPostsToUpdate(POST_UPDATE_INTERVAL,	function(urlTuples) {
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
