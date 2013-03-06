var database = require("./database.js");
var server = require("./server.js");
/*
database.clearTables();
database.insertNewBlog("Stupid.org", "person1");
database.insertNewBlog("Happy.com", "person2");
database.insertNewBlog("Smily.com", "person3");
database.insertNewBlog("Smily.com", "I am a duplicate");
database.insertLikedPost("Hope.com", "person1", "image", "text", 24);
database.insertLikedPost("Hope.com", "person2", "image", "text", 24);
database.insertLikedPost("Blibberblap.org", "person3", "Image", "foo", 121);
*/
//database.insertLikedPost("NotVeryTrendy.org", "person1", "egami", "off", 18);
//database.insertLikedPost("Qwerty.com", "person2", "Image2", "bar", 5);
//database.updatePostPopularity("Qwerty.com", 75);
//database.updatePostPopularity("Hope.com", 1);
//database.updatePostPopularity("Hope.com", 99);
//database.updatePostPopularity("Hope.com", 10);
//database.updatePostPopularity("Blibberblap.org", 122);
//database.updatePostPopularity("NotVeryTrendy.org", 40);

setTimeout(function() {
	//database.updatePostPopularity("Blibberblap.org", 20);
}, 500); 

//database.getTrendingPosts(console.log);
//database.getBlogUrls(console.log);
//database.getPostsToUpdate(2, console.log);
server.update();