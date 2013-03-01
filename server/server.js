var http = require("http");
var url = require("url");
var database = require("./database");
var tumblr = require("./tumblr");

var PORT = 1234;

function start(route, handles) {
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        route(handles, pathname, response, request);
    }

    http.createServer(onRequest).listen(PORT);
    console.log("Server has started at localhost on port " + PORT + ".");

    var info = tumblr.getLikedPosts("sillygwailo.tumblr.com", function(likes) {
        console.log("Received " + likes.length + " liked posts from Tumblr.");
    });
}

exports.start = start;
