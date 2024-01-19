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
const sqlSecurity = require('./sqlSecurity')

const passport = require("passport");

// API call to get all data from users table
const getUsers = (req, res) => {
  console.log("getUsers() in usersQueries.js")

    // Constructs sql code
    pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
      // Error handling
      if (error) {
        throw error
      }
      //Returns res that consists of all data gotten by sql code
      res.status(200).json(results.rows)
    })
}

// API call to get user by a specific ID
const getUserById = (req, res) => {
  console.log("getUserById() in usersQueries.js")
    // Specified ID to grab
    const id = parseInt(req.params.id)
    // Constructs sql code
    pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
      // Error handling
      if (error) {
        throw error
      }
      // Returns all data gotten by sql code
      res.status(200).json(results.rows)
    })
}

// API call to get user by a specific username
const getUserByUsername = (req, res) => {
  console.log("getUserByUsername() in usersQueries.js");
  // Specified username to grab
  const username = parseInt(req.params.username)
  // Constructs sql code
  pool.query('SELECT * FROM users WHERE id = $1', [username], (error, results) => {
    // Error handling
    if (error) {
      throw error
    }
    // Returns all data gotten by sql code
    res.status(200).json(results.rows)
  })
}

// API call to create entry into user database
const createUser = (req, res) => {
  console.log("createUser() in usersQueries.js")
    // Variables to be inserted into database
    const { username, password } = req.body;
    const passwordIsDangerous = sqlSecurity.checkForSqlCharacters(password);
    const usernameIsDangerous = sqlSecurity.checkForSqlCharacters(username);
    if (!usernameIsDangerous && !passwordIsDangerous) {
      // Encrypts passwordresreq
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
                  return res.redirect('/register?header=Username%20already%20taken');
              }
              throw(error);
          }
          return res.status(200).redirect('/');
        });
      });
    } else {
      console.log("DANGEROUS INPUT DETECTED ON USERNAME OR PASSWORD!");
      res.redirect('/register');
    }
};

// API call to update entry in user table
const updateUser = (req, res) => {
  console.log("updateUser() in usersQueries.js")
    // Specific ID of entry to update
    const id = parseInt(req.params.id);
    // Variables to be put into database
    const { username, password } = req.body;
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
            res.status(500).send('Error updating user.');
          } else {
            // Returns res saying entry was modified
            res.status(200).send(`User modified with ID: ${id}`);
          }
        }
      );
    });
};

// API call to delete entry from user table
const deleteUser = (req, res) => {
  console.log("deleteUser() in usersQueries.js")
    // Specific id of entry to delete
    const id = parseInt(req.params.id)
    // Constructs sql code
    pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
      // Error handling
      if (error) {
        throw error
      }
      // Returns res saying that specified entry in users table was deleted
      res.status(200).send(`User deleted with ID: ${id}`)
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
    deleteUser,
    getUserByUsername,
  };