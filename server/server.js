var http = require("http");
var url = require("url");
var database = require("./database");
var tumblr = require("./tumblr");
var nodemailer = require("nodemailer");

var cronJob = require("cron").CronJob;

var PORT = 31285;
// how often we should update our database with new information from Tumblr
// specified in cron syntax 
var INTERVAL_CRON = "*/2 * * * *";
var INTERVAL = 0; //interval length in minutes
function start(route, handles) {
    
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        route(handles, pathname, response, request);
    }

    http.createServer(onRequest).listen(PORT);
    console.log("Server has started at localhost on port " + PORT + ".");

    tumblr.getNoteCount("http:\/\/derekg.org\/post\/7431599279", function(count) {
        console.log("Got back a post with note count " + count);
    });

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

function update() {
	database.getPostsToUpdate(INTERVAL,
		function(urlTuples) {
            console.log("The posts to be updates: ");
            console.log(urlTuples);
			for (var i = 0; i < urlTuples.length; i++) {
                var url = urlTuples[i].url;
                var noteCount = urlTuples[i].note_count;
				//this is just a test insert. Really there should be a 
				//call to one of Alex's fancy methods here.
				database.updatePostPopularity(url, Math.floor(Math.random()*100));
			}
		});
}

process.on("uncaughtException", function(err) {
    
    console.log("Server crashed with following error: ");
    console.log(err);

    // setup connnection to email
    var smtpTransport = nodemailer.createTransport("SMTP", {
        service: "Gmail",
        auth: {
            user: "ratkillcat@gmail.com",
            pass: "catpoop123"
        }
    });
    
    var admins = ["spirit.of.mana@gmail.com", "daphneipp@gmail.com", "alchemicvisions@gmail.com"];
    // create a report
    var report = "Server for CSC309 A2 crashed with the following report:\n\n";
    
    // pad the actual error with some dashes
    var padding = (new Array(81)).join("-");
    report += padding;
    report += "\n" + err + "\n";
    report += padding;
    report += "\n\nThis has been an automatically generated error report.";

    var mailOptions = {
        from: "A2 Server <noreply@a2_server>",
        to: admins.join(", "),
        subject: "[CSC309 A2] Server crashed at " + new Date(),
        text: report
    };

    smtpTransport.sendMail(mailOptions, function(mailErr, res) {
        if (mailErr) {
            console.log("Could not send error report to admins: " + mailErr);
        } else {
            
            console.log("Sent error report to administrators.");
        }
    });
});

exports.update = update;
exports.start = start;
