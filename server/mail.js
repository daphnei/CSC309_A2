// mail.js
// Various emailing functions.

var nodemailer = require("nodemailer")

/**
 * Send an error report to the administrators.
 *
 * @param err The error that occurred.
 * @param onFinished A callback to run when the error report has been sent.
 *                   Takes no arguments.
 */
function sendErrorReport(err, onFinished) {

    // setup connnection to email
    var smtpTransport = nodemailer.createTransport("SMTP", {
        service: "Gmail",
        auth: {
            user: "ratkillcat@gmail.com",
            pass: "catpoop123"
        }
    });
    
    var admins = ["spirit.of.mana@gmail.com", "daphneipp@gmail.com"]; 
        //"alchemicvisions@gmail.com"];
    
    // create a report
    var report = "Server for CSC309 A2 crashed with the following report:\n\n";
    
    // pad the actual error with some dashes
    var padding = (new Array(81)).join("-");
    report += padding;
    report += "\n" + err + "\n";
    report += padding;
    report += "\n\nThe stack trace for the error is: ";
    report += err.stack
    report += "\n\nThis has been an automatically generated error report.";

    // set up all the options for sending the email
    var mailOptions = {
        from: "A2 Server <noreply@a2_server>",
        to: admins.join(", "),
        subject: "[CSC309 A2] Server crashed at " + new Date(),
        text: report
    };

    // send it off
    smtpTransport.sendMail(mailOptions, function(mailErr, res) {
        if (mailErr) {
            console.log("Could not send error report to admins: " + mailErr);
        } else {
            console.log("Sent error report to administrators.");
        }

        onFinished()
    });
}

exports.sendErrorReport = sendErrorReport;
