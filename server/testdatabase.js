var database = require("./database.js");
console.log("Working, working, nope!");

/*database.clearTables();
database.insertNewBlog("Stupid.org", "person1");
database.insertNewBlog("Happy.com", "person2");
database.insertNewBlog("Smily.com", "person3");
database.insertNewBlog("Smily.com", "I am a duplicate");
database.insertLikedPost("Hope.com", "person1", "image", "text", 24);
database.insertLikedPost("Hope.com", "person2", "image", "text", 24);
database.insertLikedPost("Blibberblap.org", "person3", "Image", "foo", 121);
*/
database.updatePostPopularity("Hope.com", 1);
//database.updatePostPopularity("Hope.com", 99);
//database.updatePostPopularity("Hope.com", 23);
//database.updatePostPopularity("Blibberblap.org", 122);


setTimeout(function() {
	//database.updatePostPopularity("Blibberblap.org", 90);
}, 500); 

//database.getTrendingPosts(console.log);


