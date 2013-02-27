var database = require("./database.js");
console.log("Working, working, nope!");

database.clearTables();
database.insertNewBlog("Stupid.org", "face");
database.insertNewBlog("Happy.com", "face");
database.insertNewBlog("Smily.com", "face");
database.insertNewBlog("Smily.com", "I am a duplicate");
database.insertLikedPost("Hope.com", "face", "image", "text", 24);
database.updatePostPopularity("Hope.com", 13);
/*
setTimeout(function() {
	database.insertNewBlog("Stupid.org", "face");
	database.insertNewBlog("Happy.com", "face");
	}, 500); 
*/

