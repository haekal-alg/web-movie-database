/*
netstat -ano | findstr "8080"
taskkill /PID PORT_NUMBER /f
*/
require('dotenv').config();
const express = require('express')
const cookieParser = require("cookie-parser");
const session = require('express-session');
const store = new session.MemoryStore()
const app = express()
const  { Client }  = require('pg')
const bp = require('body-parser')
const PORT = 8080

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

app.use(express.static('public')) // anything in public can be send in here

/* Azure
const db = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl: true
})
*/

const db = new Client({
    host: 'localhost',
    user: 'postgres',
    database: 'web_movie_database',
    password: 'haekal',
    port: 5432,
})

// session middleware
const oneDay = 1000 * 60 * 60 * 24;
app.use(session ({
    secret: "this is a secret",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
    store: store
}));

app.get('/', (req, res) => {
    let user_session = req.session;
    // if user is not logged in then send it to the login page
    if (!user_session.userid) {
        res.redirect('../login.html')
    // else send it to the search page
    } else {
        res.redirect('../search.html') 
    }
});

app.get('/api/get_session', (req, res) => {
    res.send(req.session);
});

app.post('/api/authenticate', (req, res) => {
    console.log(req.body.username)
    console.log(req.body.password)
    const myusername = 'user1'
    const mypassword = 'user1'
    // if successful, redirect to search.html
    if(req.body.username == myusername && req.body.password == mypassword) {
        let user_session = req.session;
        user_session.userid = req.body.username;
        console.log(`Login as ${user_session.userid}`)
        res.redirect('../search.html');
    }
    else{
        res.send('Invalid username or password');
    }
})

app.get('/api/logout',(req, res) => {
    req.session.destroy();
    res.redirect('../login.html');
});

app.post('/api/search_from_user', (req, res) => {
    const { title, username } = req.body
    //console.log("Search: " + title)
    //console.log(username)
    const query = 
    `SELECT 
        m.title, 
        TO_CHAR(m.release_date, 'dd Month, yyyy'), 
        m.runtime, 
        g.genre_name, 
        u.round, 
        v.count, 
        r.user_rating
    FROM 
        movies AS m 
    INNER JOIN 
        genres AS g 
        ON m.genre_id = g.genre_id 
    LEFT JOIN 
        (SELECT movie_id, ROUND(AVG(user_rating), 2) FROM users_ratings GROUP BY movie_id) AS u
        ON u.movie_id = m.movie_id
    LEFT JOIN 
        (SELECT * FROM users_ratings WHERE username = '${username}') AS r
        ON r.movie_id = m.movie_id
    LEFT JOIN
        (SELECT movie_id, COUNT(movie_id) FROM users_ratings GROUP BY movie_id) AS v
        ON v.movie_id = m.movie_id
    WHERE lower(m.title) SIMILAR TO '(${title}%|%${title}%|%${title})';` // at the start, middle or end

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log(results.rows)
        res.status(200).send(results.rows);
    });
})

db.connect((err) => {
    if (err) {
        console.log(err)
        return
    }
    console.log(`Connected to ${process.env.DB_DATABASE}`)
})

app.listen(8080, () => { console.log(`Server is running on port ${PORT}`)})