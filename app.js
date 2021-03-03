'use strict'
const EXPRESS = require('express'),
      APP = EXPRESS(),
      QY = require('./db'),
      CORS = require('cors'),
      JWT = require('jsonwebtoken'),
      UNLESS = require('express-unless'),
      BCRYPT = require('bcrypt'),      
      AUTH = (req, res, next) => {
        try {
          let token = req.headers['authorization'];
          if(!token){
            throw new Error("You must login first.");
          }
          token = token.replace('Bearer ', '');
          JWT.verify(token, 'SSDf333/:f', (error, user) => {
            if (error){
              res.status(413).send("Invalid Token.")
            }; 
          });
          next();    
        }
        catch (error) {          
          res.status(403).send(error.message);
        }
      },
      PORT = process.env.PORT || 3000;
      
AUTH.UNLESS = UNLESS;
      
APP.use(AUTH.UNLESS({
  path: [
    {url: '/signup', methods: ['POST']},
    {url: '/login', methods: ['POST']}
  ]
}));
APP.use(EXPRESS.json());
APP.use(EXPRESS.urlencoded({extended: true}));
APP.use(CORS());

APP.route('/')
.get((req, res) => {
  try {
    res.status(200).send("You're in GET '/'");
  } catch (error) {
    res.status(413).send(error.message);
  };    
});

APP.route('/signup')
.get((req, res) => {
  try {
    res.status(200).send("You're in GET '/sign-up'");
  } catch (error) {
    res.status(413).send(error.message);
  };  
})
.post(async (req, res) => {  
  try {
    if (!req.body.name || !req.body.lastName || !req.body.email || !req.body.password){
      throw new Error("Name, last name, email and password are mandatory.");
    };
    let query = 'SELECT * FROM person WHERE name = ? AND lastName = ? AND email = ?',
        data = await QY(query, [req.body.name, req.body.lastName, req.body.email]);        
    if (data.length > 0){
      throw new Error("That person already exists.");
    };

    const ENCRYPTED_PASSWORD = await BCRYPT.hash(req.body.password, 10);
    console.log(ENCRYPTED_PASSWORD);
    query = 'INSERT INTO person (name, lastName, email, age, mobileNumber, countryOrigin, countryResidence, password) VALUE (?,?,?,?,?,?,?,?)';
    data = await QY(query, [req.body.name, req.body.lastName, req.body.email, req.body.age, req.body.mobileNumber, req.body.countryOrigin, req.body.countryResidence, ENCRYPTED_PASSWORD]);
    res.status(200).send(data);
  }
  catch (error) {    
    res.status(413).send(error.message);
  };
});

APP.route('/login')
.get((req, res) => {
  try {
    res.status(200).send("You're in GET '/login'");
  } catch (error) {
      res.status(413).send(error.message);
    }
})
.post(async (req, res) => {  
  try {
    if (!req.body.email || !req.body.password){
      throw new Error("Email and password are mandatory.");
    }
    let query = 'SELECT * FROM person WHERE email = ?',
        data = await QY(query, [req.body.email]);            
    if (data.length === 0){
      console.log(data.length);
      throw new Error("That user doesn't exist.");
    };    
    if (!BCRYPT.compareSync(req.body.password, data[0].password)){
      throw new Error("Wrong password.");
    };
    
    let tokenData = {
      name : data[0].name,
      email: data[0].email,
      user_id: data[0].id
    },
      token = JWT.sign(tokenData, 'SSDf333/:f', {
        expiresIn: 60 * 60 * 24      
    });
    
    res.send({token});
  }
  catch (error) {
    console.log(error.message);
    res.status(413).send(error.message);
  }
});

APP.route('/users')
.get(async (req, res) => {
  try {
    let query = 'SELECT * FROM person',
        data = await QY(query);
    if (data.length === 0){
      throw new Error("The Database is empty.");
    };    
    res.status(200).send(data);
  } catch (error) {
      console.log(error.message);
      res.status(413).send(error.message);
  };
});

APP.route('/user/:id')
.get(async (req, res) => {
  try {        
    let query = 'SELECT * FROM person WHERE id = ?',
        data = await QY(query, [req.params.id]);   
    if (data.length === 0){
      throw new Error("That user doesn't exist.");
    };    
    res.status(200).send(data[0]);
  } catch (error) {      
      res.status(413).send(error.message);
  };
})
.put(async (req, res) => {
  try {
    if (req.body.name || req.body.lastName || req.body.countryOrigin || req.body.age){
      throw new Error("You can only modify email, mobile number or country of residence.");
    }    
    let query = 'UPDATE person SET email = ?, mobileNumber = ?, countryResidence = ? WHERE id = ?';
    let data = await QY(query, [req.body.email, req.body.mobileNumber, req.body.countryResidence, req.params.id]);
    res.status(200).send("User updated.");
  }
  catch (error) {
    console.log(error.message);
    res.status(413).send(error.message);
  };
})
.delete(async (req, res) => {
  try {    
    let query = 'SELECT id FROM person WHERE id = ?';
    let data = await QY(query, [req.params.id]);
    if (data.length === 0){
      throw new Error("That user doesn't exist.");
    };
    query = 'DELETE FROM person WHERE id = ?';
    await QY(query, [req.params.id]);        
    res.status(200).send("User Deleted.");
  }
  catch (error) {    
    res.status(413).send(error.message);
  };
});

APP.all('*', (req, res) => {  
  res.status(404).send("That route is not implemented.");
});

APP.listen(PORT, (error) => {
  if(error) {
    throw error;
  };  
  console.log("Express server listening on port",PORT);
});