DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS tracked_blogs;
DROP TABLE If EXISTS liked_posts;
DROP TABLE IF EXISTS updates;

/* Information for each tracked blog */
CREATE TABLE tracked_blogs(
    url VARCHAR(200), /* the url of the tracked blogger'*
    username VARCHAR(100), /* the username of the author of the tracked blog*/
    PRIMARY KEY(url) /* all blog urls insered must be unique*/
) ENGINE=INNODB;

/* Indicates which blog user likes which posts. This table is needed because multiple
   users can like the same post, but we only want to store one instance of each liked
   post */
CREATE TABLE likes(
    liker VARCHAR(100), /*the username of the blog post person*/
    post_url VARCHAR(200), /*the url of the liked post*/
    PRIMARY KEY(liker, post_url) /* both tuples must be part of the key because a liker
                                    can like multiple posts, and posts can be liked by
                                    multiple users*/
) ENGINE=INNODB;

/* Information for each liked posts */
CREATE TABLE liked_posts(
	url VARCHAR(200), /* the url of the liked post */
    date DATETIME, /* the date the post was made */
    image VARCHAR(100), /* the url of an associated image */
    text VARCHAR(1000), /* text associated with the post */
    note_count INTEGER, /* the latest note count for the post */
    num_updates INTEGER, /* the number of updates that have been made to the note count
                            since we started tracking*/
    PRIMARY KEY(url) /* all posts should be unique by their url */
) ENGINE=INNODB;

/* An update to the note count of a post. There can be multiple updates for 
   any single post. */
CREATE TABLE updates(
    url VARCHAR(200), /* the url of the post this update corresponds to */
    time DATETIME, /* the time the update took place */
    sequence_index INTEGER, /* the index of this update in the sequence of updates */
    increment INTEGER, /* the amount the note count has gone up since the last update */
    PRIMARY KEY(url, sequence_index) /* all updates should have a unique combinate or url
                                        and sequence index */
) ENGINE=INNODB;
