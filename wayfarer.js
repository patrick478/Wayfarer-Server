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
// Server setup
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
var userModel, subjectModel;
models.defineModels(mongoose, function() {
	userModel = mongoose.model('User');
	subjectModel = mongoose.model('Subject');
})

// ------------------------------------------------------------------------------------------------
// Other application stuffs setup
// ------------------------------------------------------------------------------------------------

// Load datapool 
var datapool;
fs = require('fs');
fs.readFile('datapool.dat', function(err, data) {
	if (err) {
		console.log ('ERROR: Unable to load datapool.dat file!');
		process.exit(1);
	}
	datapool = JSON.parse(data);
});

// Set up the Basic Authentication function.
// When authentication fails for any reason, 401 is automatically returned.
var authenticate = express.basicAuth(function(email, password, callback) {
	// Find the user by email (which is unique)
	userModel.findOne({'email':email}, function(err, user){
		// Pass errors on to the callback function instead of failing immediately.
		if (!err){
			// User not found?
			if (!user){
				console.log('authenticate: No user exists with that email address');
				err = new Error('No user exists with that email address.');
			// User found: authenticate them by comparing their password.
			// Creates a new error if they don't match, which will automatically throw a 401.
			} else if (!user.authenticate(password)){
				err = new Error('Email and password do not match.');
			}
		}
		// Callback with any errors that have arisen, and the user's profile.
		callback(err, user);		
	}); 
});

// ------------------------------------------------------------------------------------------------
// API end point setup
// ------------------------------------------------------------------------------------------------

// Root
app.get('/', function(request, response){
	response.send('See README.md in Wayfarer-Server git for API details.');
});

// GET '/users'
// Requires authentication.
// Returns the authenticated user.
app.get('/users', authenticate, function(request, response){
	var user = request.user.returnType;
	response.send(200, JSON.stringify(user, undefined, 2));
});

// PUT '/users'
// {
// 	"email": "bigmomma69@gmail.com",
// 	"password": "password",
//  "name": "Lady Sass"
// }
// Creates a user.
app.put('/users', function(request, response){

	// Validate JSON fields exist
	if (!request.body 
		|| !request.body.email
		|| !request.body.name
		|| !request.body.password){
		console.log("PUT /users: Body missing required information.");
		response.send(400, "Body missing required information.");
		return;
	}

	// Tidy up input
	request.body.email = request.body.email.trim().toLowerCase();
	request.body.name = request.body.name.trim().capitalize();

	// Find any users with the same email 
	userModel.find({'email':request.body.email}, function (err, existingUsers) {

		if (err) { internalError(err, response); return; }
 
 		// Email exists: bad! They must be unique
		if (existingUsers.length != 0) {
			console.log('PUT /users: An account already exists for that email.');
			console.log(JSON.stringify(existingUsers, undefined, 2));
			response.send(403, 'An account already exists for that email.');
			return;
		}

	  	// Create the user
	  	var newUser = new userModel(request.body);
	  	newUser.setPassword(request.body.password);

	  	// Save user in db
	  	newUser.save(function(err){
			if (err) { internalError(err, response); return; }

			// Send 'created' response including user
		  	console.log('PUT /users: New user created: ' + JSON.stringify(newUser, undefined, 2));
		  	response.send(201, newUser.returnType);
		});
	});
});

// POST '/users/{id}'
// {
//  "name": "Prince"
// }
// Updates a given user
app.post('/users', authenticate, function(request, response){

	// Validate JSON fields exist
	if (!request.body){
		console.log("POST /users Body missing or missing required information.");
		response.send(400, "Body missing required information.");
		return;
	}

	// If subjectId, make sure that subject exists
	if (request.body.subjectId) {
		subjectModel.findOne({ _id: request.body.subjectId }, function(err, subject) {
			if (err) { internalError(err, response); return; }
			if (!subject){
				response.send(404, 'That subject could not be found.');
				return;
			}	
		});
	}

	// If email, make sure it is unique
	userModel.find({'email':request.body.email}, function (err, existingUsers) {
		if (err) { internalError(err, response); return; }
		if (existingUsers.length != 0) {
			console.log('POST /users: An account already exists with that email.');
			console.log(JSON.stringify(existingUsers, undefined, 2));
			response.send(403, 'An account already exists with that email address.');
			return;
		}
	});

	// "password" as it exists in the database is different to the json body, so it needs
	// to be removed before updating the user... if it exists.
	var password;
	if (request.body.password) {
		password = request.body.password;
		delete request.body.password;
	}

	// Find and update the user.
	userModel.findByIdAndUpdate(request.user.returnType.id, request.body, function(err, user) {
		if (err) { internalError(err, response); return; }
		if (!user){
			response.send(404, 'That user could not be found: '+request.params.id);
			return;
		}
		// Also manually update password if supplied, in order to encrypt it.
		// There is a more 'automatic' method but in the interests of mental brevity this will be fine
		if (password)	{
			user.setPassword(password);
			user.save(function(err){
				if (err) { internalError(err, response); return; }
			});
		}
		console.log('POST /users/{id}: Updated user with id "'+request.user.returnType.id+'"');
		response.send(200, JSON.stringify(user.returnType, undefined, 2)); 		
	});
});

// DELETE '/users'
// Deletes the authenticated user
app.delete('/users', authenticate, function(request, response){

	// Find the user in database
	var query = userModel.remove({ _id: request.user.returnType.id }, function(err, user) {
		if (err) { internalError(err, response); return; }
		if (!user){
			response.send(404, 'That user could not be found.');
			return;
		}
		response.send(200, "User deleted"); 		
	});
});


// PUT '/subjects'
// {
//  "name": "Moe" 
// }
// Creates a subject and returns its information and the datapool.
// Also sets the authenticated user's subjectId to the new subject's id.
app.put('/subjects', authenticate, function(request, response){

	// Validate JSON fields exist
	if (!request.body || !request.body.name){
		console.log("PUT /subjects: Body missing or missing required information.");
		response.send(400, "Body missing required information.");
		return;
	}

  	// Create the subject
  	request.body.name = request.body.name.trim().capitalize();
  	var newSubject = new subjectModel(request.body);

  	// Save subject in db
  	newSubject.save(function(err){
		if (err) { internalError(err, response); return; }
	});

	// TODO if time:
	// if user has a subjectId already
		// Query database for users with subjectId = subjectId
		// if no user found
			// delete subject from database

  	// Save subjectId in user
	userModel.findByIdAndUpdate(request.user.returnType.id, { $set: { subjectId: newSubject.returnType.id }}, function(err, user) {
		if (err) { internalError(err, response); return; }
		if (!user){
			// should never happen 
			response.send(500, 'That user could not be found: '+request.params.id);
			return;
		} 		
	});
	
	// Send datapool back with response
	var toReturn = newSubject.returnType;
	toReturn.datapool = datapool;
	console.log('PUT /subjects: New subject created: ' + JSON.stringify(newSubject, undefined, 2));
	response.send(201, toReturn);
});

// GET '/subjects'
// Returns the subject watched by the authenticated user.
app.get('/subjects', authenticate, function(request, response){

	// Find the subject in database
	var query = subjectModel.findOne({ _id: request.user.returnType.subjectId }, function(err, subject) {
		if (err) { internalError(err, response); return; }
		if (!subject){
			response.send(404, 'That subject could not be found.');
			return;
		}
		response.send(JSON.stringify(subject.returnType, undefined, 2)); 		
	});
});

// POST '/subjects
// {
//  "state": {"blah":"blah"}
// }
// Updates the subject watched by the authenticated user.
app.post('/subjects', authenticate, function(request, response){

	// Validate JSON fields exist
	if (!request.body){
		console.log("POST /subjects: Body missing or missing required information.");
		response.send(400, "Body missing required information.");
		return;
	}

	// Update the subject in database
	subjectModel.findByIdAndUpdate(request.user.returnType.subjectId, request.body, function(err, subject) {
		if (err) { internalError(err, response); return; }
		if (!subject){
			response.send(404, 'That subject could not be found.');
			return;
		} 		
		console.log('POST /subjects: Updated subject "'+request.user.returnType.subjectId+'"');
		response.send(200, JSON.stringify(subject.returnType, undefined, 2)); 
	});

});

// ------------------------------------------------------------------------------------------------
// Administration end points 
// TODO: use admin authentication
// ------------------------------------------------------------------------------------------------

// Gets the datapool
app.get('/datapool', function(request, response){
	response.send(200, JSON.stringify(datapool, undefined, 2));
});

// Updates the datapool
app.post('/datapool', function(request, response){
	
	// Validate JSON fields exist
	if (!request.body){
		console.log("POST /datapool: Body missing or missing required information.");
		response.send(400, "Body missing required information.");
		return;
	}

	// Update datapool field
	datapool = request.body;

	// Write datapool back to file
	fs.writeFile("datapool.dat", JSON.stringify(datapool, undefined, 2), function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        console.log("POST /datapool: Datapool updated");
	    }
	}); 

	response.send(200);
});


// ------------------------------------------------------------------------------------------------
// Older end points that I'm not ready to retire
// ------------------------------------------------------------------------------------------------

// GET '/allUsers'
// Returns all users.  TEMPORARY DEV THING.
app.get('/allUsers', function(request, response){

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

	// Find the user in database
	var query = userModel.findById(request.params.id, function(err, user) {
		if (err) { internalError(err, response); return; }
		// User not found
		if (!user){
			response.send(404, 'That user could not be found.');
			return;
		}
		// User found; send them back.
		response.send(JSON.stringify(user.returnType, undefined, 2)); 		
	});
});

// POST '/users/{id}'
// {
//  "name": "Prince"
// }
// Updates a given user
app.post('/users/:id', function(request, response){

	// Validate JSON fields exist
	if (!request.body){
		console.log("POST /users/{id}: Body missing or missing required information.");
		response.send(400, "Body missing required information.");
		return;
	}

	// If subjectId, make sure that subject exists
	if (request.body.subjectId) {
		subjectModel.findOne({ _id: request.body.subjectId }, function(err, subject) {
			if (err) { internalError(err, response); return; }
			if (!subject){
				response.send(404, 'That subject could not be found.');
				return;
			}	
		});
	}

	// "password" as it exists in the database is different to the json body, so it needs
	// to be removed before updating the user... if it exists.
	var password;
	if (request.body.password) {
		password = request.body.password;
		delete request.body.password;
	}

	// Find and update the user.
	userModel.findByIdAndUpdate(request.params.id, request.body, function(err, user) {
		if (err) { internalError(err, response); return; }
		if (!user){
			response.send(404, 'That user could not be found: '+request.params.id);
			return;
		}
		// Also manually update password if supplied, in order to encrypt it.
		// There is a more 'automatic' method but in the interests of mental brevity this will be fine
		if (password)	{
			user.setPassword(password);
			user.save(function(err){
				if (err) { internalError(err, response); return; }
			});
		}
		console.log('POST /users/{id}: Updated user with id "'+request.params.id+'"');
		response.send(200, JSON.stringify(user.returnType, undefined, 2)); 		
	});
});

// DELETE '/users/{id}'
// Deletes the user with the given id.
app.delete('/users/:id', function(request, response){

	// Find the user in database
	var query = userModel.remove({ _id: request.params.id }, function(err, user) {
		if (err) { internalError(err, response); return; }
		if (!user){
			response.send(404, 'That user could not be found.');
			return;
		}
		response.send(200, "User deleted"); 		
	});
});

// GET '/subjects'
// Returns all subjects.  TEMPORARY DEV THING.
app.get('/allSubjects', function(request, response){
	var query = subjectModel.find( function(err, subjects) {
		if (err) { internalError(err, response); return; }
		response.send(JSON.stringify(subjects, undefined, 2)); 		
	});
});

// PUT '/subjects'
// {
//  "name": "Moe" 
// }
// Creates a subject and returns its information and the datapool.
app.put('/subjects', function(request, response){

	// Validate JSON fields exist
	if (!request.body || !request.body.name){
		console.log("PUT /subjects: Body missing or missing required information.");
		response.send(400, "Body missing required information.");
		return;
	}

  	// Create the subject
  	request.body.name = request.body.name.trim().capitalize();
  	var newSubject = new subjectModel(request.body);

  	// Save user in db
  	newSubject.save(function(err){
		if (err) { internalError(err, response); return; }

		// Send datapool back with response
		var toReturn = newSubject.returnType;
		toReturn.datapool = datapool;
	  	console.log('PUT /subjects: New subject created: ' + JSON.stringify(newSubject, undefined, 2));
	  	response.send(201, toReturn);
	});
});

// GET '/subjects'
// Returns all subjects.  TEMPORARY DEV THING.
app.get('/subjects', function(request, response){
	var query = subjectModel.find( function(err, subjects) {
		if (err) { internalError(err, response); return; }
		response.send(JSON.stringify(subjects, undefined, 2)); 		
	});
});

// GET '/subjects/{id}'
// Returns the subject with the given id.
app.get('/subjects/:id', function(request, response){

	// Find the subject in database
	var query = subjectModel.findOne({ _id: request.params.id }, function(err, subject) {
		if (err) { internalError(err, response); return; }
		if (!subject){
			response.send(404, 'That subject could not be found.');
			return;
		}
		response.send(JSON.stringify(subject.returnType, undefined, 2)); 		
	});
});

// POST '/subjects/{id}'
// {
//  "state": "blah" 
// }
// Updates a given subject
app.post('/subjects/:id', function(request, response){

	// Validate JSON fields exist
	if (!request.body){
		console.log("POST /subjects/{id}: Body missing or missing required information.");
		response.send(400, "Body missing required information.");
		return;
	}

	// Find the subject in database
	subjectModel.update({ _id: request.params.id }, request.body, function(err, numberAffected, raw) {
		if (err) { internalError(err, response); return; }
		if (numberAffected == 0){
			response.send(404, 'That subject could not be found.');
			return;
		}
		console.log('POST /subjects/{id}: Updated subject "'+request.params.id+'"');
		response.send(200); 		
	});
});

// DELETE '/subjects/{id}'
// Deletes the subject with the given id.
app.delete('/subjects/:id', function(request, response){

	// Find the subject in database
	var query = subjectModel.remove({ _id: request.params.id }, function(err, user) {
		if (err) { internalError(err, response); return; }
		if (!user){
			response.send(404, 'That subject could not be found.');
			return;
		}
		response.send(200, "Subject deleted"); 		
	});
});

// GET '/steps'
// Returns a list of all steps.  TEMP DEV THING
app.get('/steps', function(request, response){
	var jsonTest = [
		{
			id:1,
			title:'Check for possible weapons',
			description:'If you believe your friend may have weapons, ask them directly about it. Convince them to give up the weapon. Act like an authority figure.'
		},
		{
			id:2,
			title:'Don’t leave them alone',
			description:'It can be dangerous to leave a suicidal individual alone, even for a few minutes. If you have to go, make sure there is someone else to take care of them.'
		},
		{
			id:3,
			title:'Listen to them',
			description:'Listen carefully to whatever they say. If they are your friend they will likely be honest with you about how close they are to suicide.'
		},
		{
			id:4,
			title:'Offer them support',
			description:'Remind the person that you will support them no matter how bad things get. They are unlikely to commit suicide while you are around.'
		},
		{
			id:5,
			title:'Ask questions',
			description:'Asking them in more detail about why they are depressed is a good idea to share the burden. Don’t worry about depressing them further by talking about it.'
		},
		{
			id:6,
			title:'Get them help',
			description:'The individual is not likely to seek help on their own. Asking them if they would accept expert help is likely the only way they will get it.'
		}
	];
	var jsonString = JSON.stringify(jsonTest, undefined, 2);
	response.send(200, jsonString);
});

// GET '/steps/{id}' 
// Returns the informations pertaining to the step with the given id TEMP DEV THING
app.get('/steps/:id', function(request, response){
	response.send(500, "Not yet implemented");
});

// Get test TEMP DEV THING
app.get('/getTest', function(request, response){
	var jsonTest = {
		name:'Thomas Danger Norman',
		age:28,
		sex:'yes please'
	};
	var jsonString = JSON.stringify(jsonTest, undefined, 2);
	response.send(200, jsonString);
});

// Post test TEMP DEV THING
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
