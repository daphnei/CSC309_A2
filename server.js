var http = require("http");
var url = require("url");
var db = require("./db");

var PORT = 1234;

function start(route, handles) {
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        route(handles, pathname, response, request);
    }

    http.createServer(onRequest).listen(PORT);
    console.log("Server has started at localhost on port " + PORT + ".");

    db.connect();
    console.log("Connected to database successfully.");
}

exports.start = start;