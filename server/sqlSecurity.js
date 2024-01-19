const validator = require('validator');

const checkForSqlCharacters = (string) => {
  console.log("checkForSqlCharacters() in sqlInjectionSecurity.js")
  if (validator.contains(string, ';') || validator.contains(string, "--") || validator.contains(string, "'")) {
    return true;
  } else { return false; }
}

module.exports = {
  checkForSqlCharacters
}