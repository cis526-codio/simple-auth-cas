This project will walk through a quick example of building CAS authentication in Node. All the code is provided - we'll just walk you through it and explain how it works.

#### Codio Only

This project is configured to work in Codio. To host it locally, you'll need a way to make your server available via HTTPS, since that is a requirement of the test CAS server used (as well as most CAS servers in general). That is outside of the scope of this tutorial.

## Clone the Project

Start by cloning the following Git repository into the project:

```bash
git clone https://github.com/cis526-codio/simple-auth-cas
```

Then, we can open that folder in our terminal:

```bash
cd simple-auth-cas
```

## CAS Server Information

Now, open up the `server.js` file contained in this project. This Node application is built in a single file with just a few external libraries, making it easy to see all of the code. In practice, much of this functionality may be contained in a separate router or endpoints file.

At the top of the file, we see two variable definitions that are very important to working with CAS:

```js
var serviceHost = encodeURIComponent('https://' + process.env.CODIO_HOSTNAME + '-3000.codio.io/');
var casHost = 'https://testcas.cs.ksu.edu';
```

The first definition, `serviceHost`, is used to identify our application to the CAS server. In practice, many CAS servers only allow authentication from authorized applications, reducing the risk of user information and credentials being stolen by unauthorized applications. 

The second URL is for the CAS server itself. We're going to use a test CAS server that allows authentication from any application. 

## Sessions

Next, let's look at the `handleRequest()` function. Most of the functionality is contained in this single monolithic method. Again, in practice, we may divide this across multiple endpoints or routers. 

First, we start by looking for an encrypted session cookie. If one is present, we try to decrypt it and use it to populate the session. Otherwise, we'll assume that there is no session present and the user is not authenticated.

## Routes

After that, we'll switch to various pieces of code based on the URL provided. 

### Index

The `/` and `/index.html` paths will simply send a default index.html file to the user. That page contains links to the other paths.

### Login

The `/login` path is used to start the login process. For CAS, we simply redirect the user to the CAS server, along with information about where to redirect the user after a successful authentication (in this case, the `serviceHost` URL followed by the `ticket` path).

### Ticket

Once the user is authenticated by the CAS server, they are redirected back to the `/ticket` path, with a ticket included in the query string. So, we'll extract that ticket and then send a quick web request back to the CAS server to validate the ticket. Recall that CAS authentication works in two steps:

1. The user is authenticated by the CAS server and is given a ticket
1. The user gives the ticket back to the application (usually this happens automatically using browser redirects). The application can validate the ticket with the CAS server to confirm the user's identity

Once we make that request to the CAS server and receive a response, we can quickly parse the response to determine if the ticket is valid. If so, we construct a session cookie containing the user's information, and then send back a short response. 

If the ticket is invalid for any reason, the login attempt fails and a session is not created.

### Logout

The `/logout` path is very simple as well. We simply clear the cookie storing the session, and then redirect the user to the CAS server's logout page to end the session.

### One and Two

The last two paths, `/one` and `/two`, are examples of paths that are protected by the `loginRequired` middleware. That middleware simply checks for the presence of an existing session. If one is not present, the user is redirected to the `/login` path. 

### Testing

To test this system, simply run `npm start` in the project folder. It will launch on port 3000. 