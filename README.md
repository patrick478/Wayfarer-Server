Wayfarer-Server
===============

This API is in a state of flux and is very developmenty.

GET /users
----------
Gets all users in the database 

GET /users/{id}
----------
Gets a user in the database with the given ID

POST /users
----------
Adds a user to the database.
Body example (all fields required, email is unique):
{
 "email": "bigmomma69@gmail.com",
 "password": "password",
 "name": { "first": "Lady", "last": "Sass" }
}


GET /getTest
----------
Performs a simple GET test and returns some arbitrary JSON.

POST /postTest
----------
Performs a simple POST test.
