// ================================================================================================
//
// mongooseModels.js
// 
// Author: Thomas Norman (with thanks to Isabel Broome-Nicholson!)
// Created: 11/08/2013
//
// This defines the schemas, validation, methods etc for mongoose.
//
// ================================================================================================

// For encryption/decryption of password.
var crypto = require('crypto');

// Defines the models in mongoose.
function defineModels(mongoose, callback) {

  // Returns true if the given value exists and has length.
  function validatePresenceOf(value) {
    return value && value.length;
  }

  // User schema
  var userSchema = mongoose.Schema({
    name: String,
    email: { type: String, index: { unique: true } },
    password: { hashed: String, salt: String },
    subjectId: String
  });

  // Subject schema
  var subjectSchema = mongoose.Schema({
    name: String,
    state: Object
  });

  // Method: Makes a salt 
  userSchema.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  // Method: Encrypts a password using the salt
  userSchema.method('encryptPassword', function(password) {
    return crypto.createHmac('sha1', this.password.salt).update(password).digest('hex');
  });

  // Method: Authenticates the user by checking the given password against the stored one.
  userSchema.method('authenticate', function(plainText) {
    return this.encryptPassword(plainText) === this.password.hashed;
  });

  // Virtual: Get ID in hex string form
  userSchema.virtual('id').get(function() {
      return this._id.toHexString();
  });

  // Method: Creates a salt and hash's the given password before storing it.
  userSchema.method('setPassword', function(password) {
      this.password.salt = this.makeSalt();
      this.password.hashed = this.encryptPassword(password);
  });

  // Virtual: Gets a nicely formatted set of salient user information, in object form.
  userSchema.virtual('returnType').get(function(){
    var value = {
      id: this.id,
      email: this.email,
      name: this.name,
      subjectId: this.subjectId
    };
    return value;
  });
  subjectSchema.virtual('returnType').get(function(){
    var value = {
      id: this.id,
      name: this.name,
      state: this.state
    };
    return value;
  });

  // Compile the models
  mongoose.model('User', userSchema);
  mongoose.model('Subject', subjectSchema);

  // We're done; callback 
  callback();
}

// Declare the defineModels method accessible as a library function
exports.defineModels = defineModels; 


