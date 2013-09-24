// ================================================================================================
//
// wayfarer.js
// 
// Author: Thomas Norman (with thanks to Isabel Broome-Nicholson!)
// Created: 10/08/2013
//
// This is the entry point for the Wayfarer web service.  
//
// Uses:
// - Express: A web application framework for node.js
// - Mongoose: Mongodb object modelling for node.js
//
// ================================================================================================

// ------------------------------------------------------------------------------------------------
// Application setup
// ------------------------------------------------------------------------------------------------

// Express is a framework for node.js, we need it
var express = require("express");

// Get the appropriate port or default to 5000.
var port = process.env.PORT || 5000;

// Set up the application, using the express framework
var app = express();
app.use(express.logger());
app.use(express.limit('200kb'));
app.use(express.bodyParser());  // allows the app to read JSON from body
app.set('title', 'Wayfarer');

// Commence listening!
app.listen(port, function() {
	console.log("Listening on " + port);
});


// ------------------------------------------------------------------------------------------------
// API end point setup
// ------------------------------------------------------------------------------------------------

// Root
app.get('/', function(request, response){
	response.send('Hello world!<br>See README.md in Wayfarer-Server git for API details.');
});

// POST '/users'
app.post('/users', function(request, response){
	response.send(201, "post");	
});

// GET '/users'
app.get('/users/:id', function(request, response){
	response.send(200, "get "+request.params.id); 	

	

});

// ------------------------------------------------------------------------------------------------
// Helper methods
// ------------------------------------------------------------------------------------------------

function internalError(err, response) {
	console.log(err);
	response.send(500, err);
}

String.prototype.capitalize = function()
{
	return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
};

String.prototype.toTitleCase = function()
{
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
