var url = require("url");
var requestHandlers = require("./requestHandlers");

/**
 * Route a request to a path to the appropriate request handler.
 *
 * @param handles Maps request handlers of the service to regex strings.
 * @param pathname The path being requested.
 * @param response Server's response to client.
 * @param request Client's request to server.
 */
function route(handles, pathname, response, request) {
    console.log("About to route a request for " + pathname);
    
    // finding handles now uses regex, so delegated complexity to a separate
    // method.
    var handle = findHandle(handles, pathname);
    if (typeof handle === 'function') {
        handle(response, request);
    } else {
        console.log("No request handler found for " + pathname);
		requestHandlers.respond404(response);
    }
}

/**
 * Find the handle for the given path.
 * @param handles Map of request handlers to path regular expressions.
 * @param pathname The path to find the request handler for.
 *
 * @returns The handle for the given path, or null if no handle is found. 
 */
function findHandle(handles, pathname) {
    var foundHandle = null;

    // go through each path regex, try to match it to the path.
    Object.keys(handles).forEach(function(expr) {

        // since keys are stored as strings, convert to an actual regex object
        var re = new RegExp(expr, "g");

        if (matchExact(re, pathname)) {
           foundHandle = handles[expr];
        }
    });

    return foundHandle;
}

/**
 * Return whether or not the string is matched exactly by the given regex.
 *
 * @param regex The regular expression to match the string on.
 * @param str The string to test with the regular expression.
 *
 * @returns true if the regular expression matches the entire string, false
 *          otherwise.
 */
function matchExact(regex, str) {
    var match = str.match(regex);
    regex.test(str);
    return match != null && str == match[0];
}

exports.route = route;
