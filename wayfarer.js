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
// Database setup
// ------------------------------------------------------------------------------------------------

// Mongoose provides mongodb object modelling for node.js, we need it
var mongoose = require ("mongoose"); 

// Determine database URI to connect to. Uses local host if none found.
var dbURI = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/wayfarer';

// Connect to the database
mongoose.connect(dbURI, function (err, res) {
	if (err) { 
		console.log ('DB: ERROR connecting to ' + dbURI + '. ' + err);
	} else {
		console.log ('DB: Connected to ' + dbURI);
	}
});

// Get the mongoose models
var models = require('./mongooseModels');
var userModel;
models.defineModels(mongoose, function() {
	userModel = mongoose.model('User');
})

// ------------------------------------------------------------------------------------------------
// API end point setup
// ------------------------------------------------------------------------------------------------

// Root
app.get('/', function(request, response){
	response.send('Hello world!<br>See README.md in Wayfarer-Server git for API details.');
});



// POST '/users'
// {
// 	"email": "bigmomma69@gmail.com",
// 	"password": "password",
//  "name": { "first": "Lady", "last": "Sass" }
// }
// Creates a user.
app.post('/users', function(request, response){

	var body = request.body;

	// Validate JSON (this might not actually be needed)
	if (!isValidJSON) {
		console.log("POST /users: Invalid JSON body.");
		response.send(400, "Invalid JSON body.");
		return;
	}

	// Validate JSON fields exist
	if (!body 
		|| !body.email
		|| !body.name.first
		|| !body.name.last
		|| !body.password){
		console.log("POST /users: Body missing required information.");
		response.send(400, "Body missing required information.");
		return;
	}

	// Tidy up input
	body.email = body.email.trim().toLowerCase();
	body.name.first = body.name.first.trim().capitalize();
	body.name.last = body.name.last.trim().capitalize();

	// Find any users with the same email 
	userModel.find({'email':request.body.email}, function (err, existingUsers) {

		if (err) { internalError(err, response); return; }
 
 		// Email exists: bad! They must be unique
		if (existingUsers.length != 0) {
			console.log('An account already exists for that email.');
			console.log(JSON.stringify(existingUsers, undefined, 2));
			response.send(403, 'An account already exists for that email.');
			return;
		}

	  	// Create the user
	  	var newUser = new userModel(body);
	  	newUser.setPassword(body.password);

	  	// Save user in db
	  	newUser.save(function(err){
			if (err) { internalError(err, response); return; }

			// Send 'created' response including user
		  	console.log('New user created: ' + JSON.stringify(newUser, undefined, 2));
		  	response.send(201, newUser.returnType);
		});
	});
});

// GET '/users'
// Returns all users.  TEMPORARY DEV THING.
app.get('/users', function(request, response){

	// Find all users in database
	var query = userModel.find( function(err, users) {
		if (err) { internalError(err, response); return; }

		// Send users.
		response.send(JSON.stringify(users, undefined, 2)); 		
	});
});

// GET '/users/{id}'
// Returns the user with the given id.
app.get('/users/:id', function(request, response){

	// Get the user id from the request
	var userId;
	try{
		userId = mongoose.Types.ObjectId(request.params.id);
	} catch(err){
		response.send(400, 'Invalid id.  That user could not be found.');
		return;
	}

	// Find the user in database
	var query = userModel.findById(request.params.id, function(err, user) {
		if (err) { internalError(err, response); return; }
		// User not found
		if (!user){
			response.send(404, 'That user could not be found.');
			return;
		}
		// User found; send them back.
		var profile = user.returnType;
		response.send(JSON.stringify(profile, undefined, 2)); 		
	});
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

// ------------------------------------------------------------------------------------------------
// Helper methods
// ------------------------------------------------------------------------------------------------

function internalError(err, response) {
	console.log(err);
	response.send(500, err);
}

function isValidJSON(json) {
    try {
        JSON.parse(json);
        return true;
    } catch (e) {
        return false;
    }
}

String.prototype.capitalize = function()
{
	return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
};

String.prototype.toTitleCase = function()
{
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}