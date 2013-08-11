var Validator = require('jsonschema/lib/validator');

var locationSchema = {
	"id":"/Location",
	"type": "object",
	"properties": {
		"lat": {"type": "number", "required": true, "minimum": -90, "maximum": 90},
		"lon": {"type": "number", "required": true, "minimum": -180, "maximum": 180},
	}
};


var registerProfileSchema = {
	"id":"/ProfileRegister",
	"type":"object",
	"properties":{
		"email": {"type": "string", "required": true, "pattern": /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/},
		"password": {"type": "string", "required": true},
		"firstName": {"type": "string", "required": true},
		"lastName": {"type": "string", "required": true},
		"address": {"type": "string", "required": true},
		"city": {"type": "string", "required": true, "pattern": /^[A-Za-z]{3,20}\ ?([A-Za-z]{3,20})?$/},
		"postcode": {"type": "string", "required": true, "pattern": /^[1-9][0-9]{3}$/},
		"location": {"$ref": "/Location", "required": true}
	}

};


var updateProfileSchema = {
	"id":"/ProfileUpdate",
	"type":"object",
	"properties":{
		"password": {"type": "string"},
		"firstName": {"type": "string"},
		"lastName": {"type": "string"},
		"address": {"type": "string"},
		"city": {"type": "string", "pattern": /^[A-Za-z]{3,20}\ ?([A-Za-z]{3,20})?$/},
		"postcode": {"type": "string",  "pattern": /^[1-9][0-9]{3}$/},
		"location": {"$ref": "/Location" }
	}
};


var filterResourceSchema = {
	"id":"/FilterResource",
	"type":"object",
	"properties": {
		"lat": {"type": "number", "required": true, "minimum": -90, "maximum": 90},
		"lon": {"type": "number", "required": true, "minimum": -180, "maximum": 180},
		"radius": {"type": "number", "required":true, "minimum": 0},
		"filter": {"type": "array", "items": {"type": "string"}},
		"searchterm": {"type": "string"}
	}
}

var addResourceSchema = {
	"id":"/AddResource",
	"type":"object",
	"properties": {
		"location":{"$ref": "/Location", "required": true },
		"type": {"type": "string", "required":true},
		"title": {"type": "string", "required":true},
		"description": {"type": "string", "required":true},
		"points": {"type": "number", "required":true, "minimum": 1, "maximum": 5},
	}
}

var updateResourceSchema = {
	"id":"/UpdateResource",
	"type":"object",
	"properties": {
		"location":{"$ref": "/Location"},
		"type": {"type": "string"},
		"title": {"type": "string"},
		"description": {"type": "string"},
		"points": {"type": "number", "minimum": 1, "maximum": 5},
	}
}


// A method that allows validating of JSON files.
function validateJSON(body, schema){
	var v = new Validator();
	v.addSchema(locationSchema, '/Location');
	v.addSchema(updateProfileSchema, '/ProfileUpdate');
	v.addSchema(registerProfileSchema, '/ProfileRegister');
	v.addSchema(filterResourceSchema, '/FilterResource');
	v.addSchema(addResourceSchema, '/AddResource');
	v.addSchema(addResourceSchema, '/UpdateResource');

	var validateResult = v.validate(body, schema);
	if (validateResult.length){
		console.log(validateResult);
		return validateResult[0].property.replace("instance.", "") + " field is invalid.";
	}

	return null;
}

// make the schemas and methods accessible
exports.validateJSON = validateJSON;
exports.UpdateProfileSchema = updateProfileSchema;
exports.RegisterProfileSchema = registerProfileSchema;
exports.FilterResourceSchema = filterResourceSchema;
exports.AddResourceSchema = addResourceSchema;
exports.UpdateResourceSchema = updateResourceSchema;


