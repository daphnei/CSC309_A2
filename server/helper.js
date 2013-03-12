/* helper.js
 * Various helper functions that don't really fit in anywhere else.
 */

/* STRINGS */

/**
 * Remove all instances of characters from the given string.
 * @param str The string to remove characters from.
 * @param chars Either a single character, or an array of characters, to
 *              be removed.
 *
 * @returns A copy of the string with all instances of the given characters
 *          removed.
 */ 
function removeAll(str, chars) {
    if (chars instanceof Array) {
        // go through each character and remove it
        result = str;
        for (var i = 0; i < chars.length; i++) {
            result = result.replace(new RegExp(chars[i], "g"), "");
        }
        return result;
    } else {
        return str.replace(chars, "");
    }
}

/* JSON */

/**
 * Format the given dictionary into a parameter string for a url.
 *
 * @param params A hash with parameter names as keys and parameter values as
 *               values.
 * 
 * @returns A string in the format "<name1>=<value1>&<name2>=<value2>&..."
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

/* EXPORTS */

exports.asURLParams = asURLParams;
exports.removeAll = removeAll;
