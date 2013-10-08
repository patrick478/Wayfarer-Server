Wayfarer-Server
===============

All put/post requests that have JSON attached must include a `Content-Type`:`application/json` header.

Many methods require an authentication header; this uses the basic authentication format using the email and password of the user.

User methods
-----

**PUT /users**

    {
        "email": "bigmomma69@gmail.com",
        "password": "password",
        "name": "Lady sass"
    }
    
Creates a new user. *All fields above must be supplied.*
Returns 201 CREATED on success, as well as the newly created user's information.  
This includes the user's id.

**POST /users**

    {
        "name": "Shinequa",
        "subjectId": "523ffafa634d160200000001"
    }
    
*Requires authentication header*. Updates a user. The user's id must *not* be supplied in the json (ie. the id cannot be changed).
All fields are optional; ie, only the ones you want to change should be supplied.  
If the email is supplied, it must be unique.  If the subjectId is supplied, the subject with that ID must exist.  This is the primary means of changing a user's subject.
Returns 200 OK on success.

**GET /users**

*Requires authentication header* Gets all information on the user.
Returns 200 OK on success.

**DELETE /users**

*Requires authentication header* Deletes the user.
Returns 200 OK on success.


Subject methods
----------

**PUT /subjects**

    {
        "name": "Moe"
    }
    
*Requires authentication header* Creates a new subject. All fields above must be supplied (currently, just a non-unique name). 
The user's subjectId is set to the created subject's id.
Returns 201 CREATED on success, as well as the newly created subject's information.  
This includes the subject's id and a copy of the datapool in its 'datapool' property.

**POST /subjects**

    {
        "state": { "what":"ever","goes":"here" }
    }
    
*Requires authentication header* Updates the subject watched by the authenticated user. 
The subject's id must *not* be supplied in the json (ie. the id cannot be changed).
All fields are optional; ie, only the ones you want to change should be supplied.
This is the primary means of updating a subject's state.
Returns 200 OK on success.

**GET /subjects**

*Requires authentication header* Gets all information on the subject watched by the authenticated user, including their state.
Returns 200 OK on success.


Other methods
----------

**GET /datapool**

Retrieves the datapool in JSON format as its body.

**POST /datapool**

    {
        "whatever": { "what":"ever","goes":"here" }
    }
    
Sets the datapool to the body of the post.
