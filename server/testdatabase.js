var database = require("./database.js");
var server = require("./server.js");

function testFillDatabase() {
	database.clearTables();
	database.insertNewBlog("Stupid.org", "person1");
	database.insertNewBlog("Happy.com", "person2");
	database.insertNewBlog("Smily.com", "person3");
	database.insertNewBlog("Smily.com", "I am a duplicate");
	database.insertLikedPost("Hope.com", '2013-02-03', "person1", "image", "text", 24);
	database.insertLikedPost("Hope.com", '2013-02-19', "person2", "image", "text", 24);
	database.insertLikedPost("Blibberblap.org", '2013-01-29', "person3", "Image", "foo", 121);
	database.insertLikedPost("Bing.org", '2012-07-08', "person2", "magic", "off", 15);
	database.insertLikedPost("Sting.com", '2012-07-09', "person2", "dolphin", "bar", 11);
	database.insertLikedPost("Floo.org", '2012-07-11', "person2", "hanger", "foo", 64);
	database.insertLikedPost("Boo.com", '2012-07-10', "person2", "man", "bar", 23);
}

function testSomeUpdates() {
	database.clearTables();
	database.insertNewBlog("Stupid.org", "person1");
	database.insertLikedPost("http://matpringle.tumblr.com/post/43579377637/just-a-few-of-sarahs-favourite-things", '2013-02-03', "person1", "image", "text", 1); 
}
	

setTimeout(function() {
	//database.updatePostPopularity("Blibberblap.org", 20);
}, 500); 
//resetAndFillDatabase();
//database.getTrendingPosts('thisistheverge', 10, console.log);
//database.getTrendingPosts("person3", 10, console.log);
//database.getBlogUrls(console.log);
//database.getPostsToUpdate(2, console.log);
//server.update();

//estSomeUpdates();
/*setTimeout(function() {
	database.updatePostPopularity("Hope.com", 10);
	setTimeout(function() {
		database.updatePostPopularity("Hope.com", 20);
	}, 500); 
}, 500);*/

//database.checkIfUsernameExists("person1", console.log);
//database.checkIfUsernameExists("4e3wwwwwtery", console.log);


