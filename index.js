require("./utils.js");
require('dotenv').config();
const Joi = require("joi");
const express = require("express");
const session = require("express-session");
const bcrypt = require('bcrypt');
const MongoStore = require('connect-mongo');

const app = express();
const port = process.env.PORT || 3000;
const expireTime = 60 * 60 * 1000;;
const saltRounds = 12;

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({extended: false}));

var { database } = include('databaseConnection');
const userCollection = database.db(mongodb_database).collection('users');

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
	crypto: {
		secret: mongodb_session_secret
	}
})

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
  secret: node_session_secret,
  store: mongoStore, 
  saveUninitialized: false, 
  resave: true
}));

app.get("/", (req, res) => {
  if (req.session.username) {
    res.redirect('/loggedin');
  } else {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Home Page</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              flex-direction: column;
              gap: 10px;
            }
            a {
              text-decoration: none;
              color: #333;
              font-size: 18px;
            }
            a:hover {
              color: #666;
            }
            button {
              padding: 8px 16px;
              font-size: 16px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <a href="/signup"><button>Sign up</button></a>
          <a href="/login"><button>Log in</button></a>
        </body>
      </html>
    `;
    res.send(html);
  }
});

app.get("/members", (req, res) => {
  if (!req.session.username) {
    res.redirect('/');
    return;
  }

  const gifs = [
    "/gifs/gif1.gif",
    "/gifs/gif2.webp",
    "/gifs/gif3.webp"
  ];
  
  const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Members Area</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            flex-direction: column;
            gap: 15px;
          }
          h1 {
            color: #2c3e50;
          }
          a {
            text-decoration: none;
            color: #333;
            font-size: 18px;
          }
          a:hover {
            color: #666;
          }
          .gif-container {
            margin: 20px 0;
          }
          button {
            padding: 8px 16px;
            font-size: 16px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h1>Welcome to the Members Area, ${req.session.username}!</h1>
        <div class="gif-container">
          <img src="${randomGif}" alt="Random GIF" style="max-width: 400px;">
        </div>
        <a href="/loggedin"><button>Back to Home</button></a>
        <a href="/logout"><button>Log Out</button></a>
      </body>
    </html>
  `;
  res.send(html);
});

app.get("/signup", (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sign Up</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            flex-direction: column;
            gap: 15px;
          }
          form {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 300px;
          }
          input {
            padding: 8px;
            font-size: 16px;
          }
          button {
            padding: 8px 16px;
            font-size: 16px;
            cursor: pointer;
          }
          .error {
            color: red;
            margin-bottom: 10px;
          }
          .field-error {
            color: red;
            font-size: 14px;
            margin-top: -8px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <h1>Create User</h1>
        ${req.query.error ? `<p class="error">${req.query.error}</p>` : ''}
        <form action='/submitUser' method='post'>
          <input name='username' type='text' placeholder='Username' value="${req.query.username || ''}">
          ${req.query.usernameError ? `<p class="field-error">${req.query.usernameError}</p>` : ''}
          <input name='email' type='email' placeholder='Email' value="${req.query.email || ''}">
          ${req.query.emailError ? `<p class="field-error">${req.query.emailError}</p>` : ''}
          <input name='password' type='password' placeholder='Password'>
          ${req.query.passwordError ? `<p class="field-error">${req.query.passwordError}</p>` : ''}
          <button>Submit</button>
        </form>
      </body>
    </html>
  `;
  res.send(html);
});

app.get("/login", (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Login</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            flex-direction: column;
            gap: 15px;
          }
          form {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 300px;
          }
          input {
            padding: 8px;
            font-size: 16px;
          }
          button {
            padding: 8px 16px;
            font-size: 16px;
            cursor: pointer;
          }
          .error {
            color: red;
            margin-bottom: 10px;
          }
          .field-error {
            color: red;
            font-size: 14px;
            margin-top: -8px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <h1>Login</h1>
        ${req.query.error ? `<p class="error">${req.query.error}</p>` : ''}
        <form action='/login' method='post'>
          <input name='email' type='email' placeholder='Email' value="${req.query.email || ''}">
          ${req.query.emailError ? `<p class="field-error">${req.query.emailError}</p>` : ''}
          <input name='password' type='password' placeholder='Password'>
          ${req.query.passwordError ? `<p class="field-error">${req.query.passwordError}</p>` : ''}
          <button>Login</button>
        </form>
      </body>
    </html>
  `;
  res.send(html);
});

app.get("/loggedin", (req, res) => {
  if (!req.session.username) {
    res.redirect('/');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Welcome Back</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            flex-direction: column;
            gap: 15px;
          }
          .welcome {
            font-size: 24px;
            margin-bottom: 20px;
          }
          a {
            text-decoration: none;
            color: #333;
            font-size: 18px;
          }
          a:hover {
            color: #666;
          }
          button {
            padding: 8px 16px;
            font-size: 16px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="welcome">Hello, ${req.session.username}!</div>
        <a href="/members"><button>Members Area</button></a>
        <a href="/logout"><button>Log out</button></a>
      </body>
    </html>
  `;
  res.send(html);
});

app.post('/login', async (req,res) => {
  var email = req.body.email;
  var password = req.body.password;

  const errors = {};
  if (!email) errors.emailError = 'Email is required';
  if (!password) errors.passwordError = 'Password is required';

  if (Object.keys(errors).length > 0) {
    const queryParams = new URLSearchParams({
      ...errors,
      email: email || ''
    }).toString();
    return res.redirect(`/login?${queryParams}`);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.redirect(`/login?emailError=Invalid email format&email=${encodeURIComponent(email)}`);
  }

  const result = await userCollection.find({email: email}).project({username: 1, password: 1, _id: 1}).toArray();

  if (result.length != 1) {
    return res.redirect(`/login?error=User not found&email=${encodeURIComponent(email)}`);
  }

  if (await bcrypt.compare(password, result[0].password)) {
    req.session.authenticated = true;
    req.session.username = result[0].username;
    req.session.cookie.maxAge = expireTime;
    return res.redirect('/loggedin');
  }
  else {
    return res.redirect(`/login?error=Incorrect password&email=${encodeURIComponent(email)}`);
  }
});

app.post('/submitUser', async (req,res) => {
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;

  const errors = {};
  if (!username) errors.usernameError = 'Username is required';
  if (!email) errors.emailError = 'Email is required';
  if (!password) errors.passwordError = 'Password is required';

  if (Object.keys(errors).length > 0) {
    const queryParams = new URLSearchParams({
      ...errors,
      username: username || '',
      email: email || ''
    }).toString();
    return res.redirect(`/signup?${queryParams}`);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.redirect(`/signup?emailError=Invalid email format&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`);
  }

  const schema = Joi.object({
    username: Joi.string().alphanum().max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required()
  });

  try {
    await schema.validateAsync({username, email, password});
  } catch (validationError) {
    const errors = {};
    validationError.details.forEach(detail => {
      const field = detail.path[0];
      errors[`${field}Error`] = detail.message;
    });
    const queryParams = new URLSearchParams({
      ...errors,
      username: username || '',
      email: email || ''
    }).toString();
    return res.redirect(`/signup?${queryParams}`);
  }

  const existingUser = await userCollection.findOne({username: username});
  if (existingUser) {
    return res.redirect(`/signup?usernameError=Username already taken&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`);
  }

  const existingEmail = await userCollection.findOne({email: email});
  if (existingEmail) {
    return res.redirect(`/signup?emailError=Email already registered&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`);
  }

  var hashedPassword = await bcrypt.hash(password, saltRounds);

  await userCollection.insertOne({
    username: username,
    email: email,
    password: hashedPassword
  });

  req.session.authenticated = true;
  req.session.username = username;
  req.session.cookie.maxAge = expireTime;

  res.redirect('/loggedin');
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.use((req, res) => {
  res.status(404).send("Page not found - 404");
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});