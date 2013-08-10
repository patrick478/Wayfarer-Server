// ================================================================================================
//
// wayfarer.js
// 
// Author: Thomas Norman
// Created: 10/08/2013
//
// This is the entry point for the Wayfarer web service.  
//
// Uses:
// - Express: A web application framework for node.js
//
// ================================================================================================

// Includes
var express = require("express");

// Get the appropriate port or default to 5000.
var port = process.env.PORT || 5000;

// Set up the application, using the express framework
var app = express();
app.use(express.logger());
app.use(express.limit('200kb'));
app.use(express.bodyParser());  // allows the app to read JSON from body
app.set('title', 'Wayfarer');

// ------------------------------------------------------------------------------------------------
// API End Points
// ------------------------------------------------------------------------------------------------

// Root
app.get('/', function(request, response){
	response.send('Hello world!<br>See README.md in Wayfarer-Server git for API details.');
});

// Get test
app.get('/getTest', function(request, response){
	var jsonTest = {
		name:'Thomas Danger Norman',
		age:28,
		sex:'yes please'
	};
	var jsonString = JSON.stringify(jsonTest, undefined, 2);
	response.send(200, jsonString);
});

// Post test
app.post('/postTest', function(request, response){
	response.send(200, 'Post test success.');
});

// Commence listening!
app.listen(port, function() {
	console.log("Listening on " + port);
});


