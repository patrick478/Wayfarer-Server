Wayfarer-Server
===============

All put/post requests that have JSON attached must include a `Content-Type`:`application/json` header.

Note that there is no authentication or validation at the moment; anyone can perform any action.

User methods
-----

**PUT /users**

    {
        "email": "bigmomma69@gmail.com",
        "password": "password",
        "name": { "first": "Lady", "last": "Sass" }
    }
    
Creates a new user. *All fields above must be supplied.*
Returns 201 CREATED on success, as well as the newly created user's information.  
This includes the user's id.

**POST /users/{id}**

    {
        "name": { "first": "Shinequa" },
        "subjectId": "523ffafa634d160200000001"
    }
    
Updates a user with the given id. The user's id must *not* be supplied in the json (ie. the id cannot be changed).
All fields are optional; ie, only the ones you want to change should be supplied.  
If the subjectId is supplied, the subject with that ID must exist.  This is the primary means of changing a user's subject.
Returns 200 OK on success.

**GET /users/{id}**

Gets all information on the user with the given id.
Returns 200 OK on success.

**GET /users**

(TEMPORARY DEV ONLY)
Gets all information on all users. 
Returns 200 OK on success

**DELETE /users/{id}**

Deletes the user with the given id.
Returns 200 OK on success.

Subject methods
----------

**PUT /subjects**

    {
        "name": "Moe"
    }
    
Creates a new subject. All fields above must be supplied (currently, just a non-unique name).
Returns 201 CREATED on success, as well as the newly created subject's information.  
This includes the subject's id and a copy of the datapool in its 'datapool' property.

**POST /subjects/{id}**

    {
        "state": { "what":"ever","goes":"here" }
    }
    
Updates a subject with the given id. The subject's id must *not* be supplied in the json (ie. the id cannot be changed).
All fields are optional; ie, only the ones you want to change should be supplied.
This is the primary means of updating a subject's state.
Returns 200 OK on success.

**GET /subjects/{id}**

Gets all information on the subject with the given id, including their state.
Returns 200 OK on success.

**GET /subjects**

(TEMPORARY DEV ONLY)
Gets all information on all subjects. 
Returns 200 OK on success.

**DELETE /subjects/{id}**

Deletes the subject with the given id.
Returns 200 OK on success.

Other methods
----------

**GET /getTest**

Performs a simple GET test and returns some arbitrary JSON.

**POST /postTest**

Performs a simple POST test.
