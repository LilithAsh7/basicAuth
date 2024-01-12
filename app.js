// Import and start an express app
const express = require('express');
const app = express();
const port = 3001;
// Passport for use authentication and login purposes.
const passport = require('passport');
// Session module for implementing cookies for authentication and authorization.
const session = require('express-session');
const cookieParser = require('cookie-parser');
