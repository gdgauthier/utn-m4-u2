'use strict'
const MYSQL = require('mysql'),      
      CONNECTION = MYSQL.createConnection({
        host: 'sql10.freemysqlhosting.net',
        user: 'sql10394198',
        password: 'K2Ak1gD9lw',
        database: 'sql10394198'
      }),
      UTIL = require('util'),
      QY = UTIL.promisify(CONNECTION.query).bind(CONNECTION);

CONNECTION.connect((error) => {
  if(error) {
    throw error;
  }
  console.log("Connected to Database");
});

module.exports = QY;