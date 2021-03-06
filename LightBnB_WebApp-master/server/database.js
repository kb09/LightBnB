const { Pool } = require('pg');
const properties = require('./json/properties.json');
const users = require('./json/users.json');

// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

 const pool = new Pool({
  user: 'vagrant',
  password: '123',
  database: 'lightbnb'
});

const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;
  // if an owner_id is passed in
  if(options.owner_id){ 
    queryParams.push(options.owner_id);
    queryString += `AND properties.owner_id = $${queryParams.length} `;
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `and city ILIKE $${queryParams.length} `;
  }
  
  //if a minimum_price_per_night and a maximum_price_per_night
  //only return properties within that price range

  if(options.minimum_price_per_night && options.maximum_price_per_night){
    queryParams.push(Number(options.minimum_price_per_night) * 100);
    queryString += `AND properties.cost_per_night BETWEEN $${queryParams.length} `;
    queryParams.push(Number(options.maximum_price_per_night) * 100);
    queryString += `AND $${queryParams.length} `;
  }

  //if a minimum_rating is passed in
  //only return properties with a rating equal to or higher than that

  if(options.minimum_rating){
    queryParams.push(options.minimum_rating);
    queryString += `AND property_reviews.rating >= $${queryParams.length} `;  
  }
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams).then((res) => res.rows);

 }
exports.getAllProperties = getAllProperties;


// get user with email

//takes email and return a promise
//promise should resolve with the user that has that email address
//or null if that user does not exist

const getUserWithEmail = function(email) {
  return pool.query(`
      SELECT *
      FROM users
      WHERE email = $1;
    `, [email])
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */


// get user with id 

//same as getUserWithEmail but using id instead of email

const getUserWithId = function(id) {
  return pool.query(`
    SELECT *
    FROM users
    WHERE id = $1;
  `, [id])
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });
}
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

// add user 

//takes a user with name, email, and password property
//insert the new user into the database and return a promise that resolves with the new user object
//contain the user's id after it's been added to the database

const addUser =  function(user) {
  const {name, email, password} = user;
  return pool.query(`
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *;
  `, [name, email, password])
  .then(res =>  res.rows[0])
  .catch(err => console.log(err.message));
}
exports.addUser = addUser;


/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
 const getAllReservations = function(guest_id, limit = 10) {
  return pool.query(` SELECT * 
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  WHERE guest_id = $1
  LIMIT $2
  `, [guest_id, limit])
  .then(res => res.rows)
  .catch(err => console.log('err', err))
}
exports.getAllReservations = getAllReservations;


// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

 const addProperty = function(property) {
  const { owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street,
    city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms
  } = property;


  return pool.query(`
  INSERT INTO properties
  ( owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province,
    post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
    
    VALUES 
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    
    RETURNING *
  `, [owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city,
    province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms])
    .then(res => res.rows[0])
    .catch(err => console.log('err:', err));
}
exports.addProperty = addProperty;