require('dotenv').config();
const Pool = require('pg').Pool;
const pool = new Pool({
    user: process.env.db_user,
    host: process.env.db_host,
    database: process.env.db_name,
    password: process.env.db_password,
    port: process.env.db_port
});
// Imports bcrypt for authentication purposes
// saltRounds dictates how much power to put towards hashing
const bcrypt = require('bcrypt')
const saltRounds = 10;

const passport = require("passport");

// API call to get all data from users table
const getUsers = (request, response) => {

    // Constructs sql code
    pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
      // Error handling
      if (error) {
        throw error
      }
      //Returns response that consists of all data gotten by sql code
      response.status(200).json(results.rows)
    })
}

// API call to get user by a specific ID
const getUserById = (request, response) => {
    // Specified ID to grab
    const id = parseInt(request.params.id)
    // Constructs sql code
    pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
      // Error handling
      if (error) {
        throw error
      }
      // Returns all data gotten by sql code
      response.status(200).json(results.rows)
    })
}

// API call to create entry into user database
const createUser = (request, response) => {
    // Variables to be inserted into database
    const { username, password } = request.body;
    // Encrypts password
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      // Error handling for bcrypt.hash function  
      if (err) {
            throw err;
      }
      // Constructs sql code
      // Note this adds the hashed password to the database, not the input password
      pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [username, hashedPassword], (error, results) => {
        // Error handling
        if (error) {
            if (error.code === '23505' && error.constraint === 'unique_username') {
                return response.redirect('/register?header=Username%20already%20taken');
            }
            throw(error);
        }
        return response.redirect('/');
      });
    });
};

// API call to update entry in user table
const updateUser = (request, response) => {
    // Specific ID of entry to update
    const id = parseInt(request.params.id);
    // Variables to be put into database
    const { username, password } = request.body;
    // Encrypts password
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      // Error handling for encryption
      if (err) {
        throw err;
      }
      // Constructs sql code
      pool.query(
        'UPDATE users SET username = $1, password = $2 WHERE id = $3',
        [username, hashedPassword, id],
        (error, results) => {
          // Error handling
          if (error) {
            response.status(500).send('Error updating user.');
          } else {
            // Returns response saying entry was modified
            response.status(200).send(`User modified with ID: ${id}`);
          }
        }
      );
    });
};

// API call to delete entry from user table
const deleteUser = (request, response) => {
    // Specific id of entry to delete
    const id = parseInt(request.params.id)
    // Constructs sql code
    pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
      // Error handling
      if (error) {
        throw error
      }
      // Returns response saying that specified entry in users table was deleted
      response.status(200).send(`User deleted with ID: ${id}`)
    })
}

// Serializes user object so it can be stored in the session (This stores only the users ID)
passport.serializeUser((user_id, done) => done(null, user_id));
// Deserialize user object, meaning it reverts it back to it's original state
passport.deserializeUser(async (user_id, done) => done(null, user_id));

// Exporting API calls
module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
  };