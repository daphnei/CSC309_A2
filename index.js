require('./route');
var server = require('./server');
var router = require('./router');
var requestHandlers = require('./requestHandlers');

var handle = {}

/* the main pages of the REST api */
handle['/blog'] = 
