/** server.js
 * Server for an example of sessions
 */

// Constants
const PORT = 3000;

// Requires
var fs = require('fs');
var http = require('http');
var https = require('https');
var process = require('process');
var encryption = require('./lib/encryption');
var parseCookie = require('./lib/cookie-parser');
var urlencoded = require('./lib/form-urlencoded');
var server = new http.Server(handleRequest);

// The serviceHost (our server) and casHost (the CAS server)
// hostnames, we nee to build urls.  Since we pass our serviceHost
// as a url component in the search string, we need to url-encode it.
var serviceHost = encodeURIComponent('https://' + process.env.CODIO_HOSTNAME + '-3000.codio.io/');
var casHost = 'https://testcas.cs.ksu.edu';

/** @function handleRequest
 * The webserver's request handling function
 * @param {http.incomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 */
function handleRequest(req, res) {

  // We need to determine if there is a logged-in user.
  // We'll check for a session cookie
  var cookies = parseCookie(req.headers.cookie);

  // To better protect against manipulation of the session
  // cookie, we encrypt it before sending it to the
  // client.  Therefore, the cookie they send back is
  // likewise encrypted, and must be decrypted before
  // we can make sense of it.
  var cryptedSession = cookies["cryptsession"];

  // There may not yet be a session
  if(!cryptedSession) {
    // if not, set req.session to be empty
    req.session = {}
  } else {
    // if so, the session is encrypted, and must be decrypted
    var sessionData = encryption.decipher(cryptedSession);
    // further, it is in JSON form, so parse it and set the
    // req.session object to be its parsed value
    req.session = JSON.parse(sessionData);
  }

  // Split the url into its parts
  var urlParts = require('url').parse(req.url);

  switch(urlParts.pathname) {
    // Serve the index file
    case '/':
    case '/index.html':
      fs.readFile('public/index.html', function(err, data){
        if(err){
        }
        res.setHeader("Content-Type", "text/html");
        res.end(data);
      });
      break;

    case '/login':
      // CAS authentication begins by redirecting to our CAS server
      res.statusCode = 302;
      res.setHeader("Location", casHost + "/login?service=" + serviceHost + "ticket");
      res.end();
      break;

    case '/ticket':
      // The logout process posts to this URL, so just ignore
      if (req.method != "GET") return;
      // get the ticket from the querystring
      var ticket = require('querystring').parse(urlParts.search.slice(1))['ticket'];
      // We need to verify this ticket with the CAS server,
      // by making a request against its serviceValidate url
      var url = casHost + '/serviceValidate?ticket=' + ticket + '&service=' + serviceHost + "ticket";
      https.get(url, function(response){
        var body = "";
        // The request body will come in chunks; we
        // must collect it
        response.on('data', function(chunk){
          body += chunk;
        });
        // Once it's collected, we want to see if
        // it contains a success or failure message
        response.on('end', function(){
          // The contents are XML, and we can look
          // for a <cas:user>username</cas:user>
          // element if our user logged in successfully
          var match = /<cas:user>(\S+)<\/cas:user>/.exec(body);
          if(match) {
            // if we have a match, the user logged in
            // through the CAS service; we need to create
            // a session object recognizing that
            var session = {username: match[1]}
            var sessionData = JSON.stringify(session);
            var sessionCrypt = encryption.encipher(sessionData);
            res.setHeader('Set-Cookie', ['cryptsession=' + sessionCrypt + '; session;']);
            // Typically you would redirect back to the home page here
            // But we'll just write some links
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html");
            res.end('Logged in! <a href="/">Back to Home</a>');
          } else {
            // If there is no match, the CAS server rejected
            // the token.
            res.statusCode = 403;
            res.end("Unauthorized");
          }
        });
      }).on('error', function(err) {
        console.error(err);
        res.statusCode = 500;
        res.end();
      });;
      break;

    case '/logout':
      // Clear the session by flushing its value
      res.setHeader("Set-Cookie", ["cryptsession="]);
      // To logout we must let the CAS server know as well
      res.statusCode = 302;
      res.setHeader("Location", casHost + "/logout");
      res.end();
      break;


    case '/one':
      // Make sure the user is logged in before serving
      // this resource
      loginRequired(req, res, function(req,res){
        res.end("You can access this resource (ONE)!");
      });
      break;

    case '/two':
      // Make sure the user is logged in before serving
      // this resource
      loginRequired(req, res, function(req,res){
        res.end("You can access this resource (TWO)!");
      });
      break;

    default:
      res.statusCode = 404;
      res.end();

  }
}


/** @function loginRequired
 * A helper function to make sure a user is logged
 * in.  If they are not logged in, the user is
 * redirected to the login page.  If they are,
 * the next request handler is invoked.
 * @param {http.IncomingRequest} req - the request object
 * @param {http.serverResponse} res - the response object
 * @param {function} next - the request handler to invoke if
 * a user is logged in.
 */
function loginRequired(req, res, next) {
  // Make sure both a session exists and contains a
  // username (if so, we have a logged-in user)
  if(!(req.session && req.session.username)) {
    // Redirect to the login page
    res.statusCode = 302;
    res.setHeader('Location', '/login');
    return res.end();
  }
  // Pass control to the next request handler
  next(req, res);
}

// Start the server
server.listen(PORT, function(){
  console.log("Listening on port:", PORT);
});
