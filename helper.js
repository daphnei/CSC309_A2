/*
 * helper.js
 * Various helper functions that don't really fit in anywhere else.
 */

/* JSON */

/**
 * Format the given dictionary into a parameter string for a url.
 *
 * @param params A hash with parameter names as keys and parameter values as
 *               values.
 * 
 * @returns A string of the format "<name1>=<value1>&<name2>=<value2>&..."
 */
function asURLParams(params) {

    // format each param into a "<key>=<value>" string.
    result = new Array();
    Object.keys(params).forEach(function(key) {
        result.push(key + "=" + params[key]);
    });

    // now join them together
    return result.join("&");
}

/* Exports */

exports.asURLParams = asURLParams;
