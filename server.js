/*
netstat -ano | findstr "8080"
taskkill /PID PORT_NUMBER /f
*/
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const app = express();
const { Client } = require("pg");
const bp = require("body-parser");
const alert = require("alert");
const PORT = 8080;

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

app.use(express.static("public")); // anything in public can be send in here

// const db = new Client({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     database: process.env.DB_DATABASE,
//     password: process.env.DB_PASSWORD,
//     port: 5432,
//     ssl: true
// })

const db = new Client({
  host: "haekal-sbd.postgres.database.azure.com",
  user: "haekal_sbd",
  database: "web_movie_database",
  password: "Random123",
  ssl: true,
});

// session middleware
const oneDay = 1000 * 60 * 60 * 24;
app.use(
  session({
    secret: "this is a secret",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);

app.get("/", (req, res) => {
  // if user is not logged in then send it to the login page
  if (!req.session.userid) res.redirect("../login.html");
  else res.redirect("../search.html");
});

app.get("/api/get_session", (req, res) => {
  res.send(req.session);
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT password FROM users WHERE username = '${username}'`;
  db.query(query, (err, results) => {
    if (err) {
      console.log(err);
      return;
    }
    const dataPassword = JSON.parse(JSON.stringify(results.rows));
    try {
      if (bcrypt.compare(password, dataPassword[0].password)) {
        let user_session = req.session;
        user_session.userid = username;
        console.log(`Login as ${user_session.userid}`);
        // res.send("Login successful!");
        if (username != "admin") {
          res.redirect("../search.html");
        } else {
          res.redirect("../admin.html");
        }
      } else {
        res.send("Invalid username or password");
      }
    } catch {
      res.status(500).send("gagal");
    }
  });
});

app.post("/api/register", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const repassword = req.body.repassword;
  //try {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  //kondisi apabila username sama dengan database belum
  if (!username || !password || !repassword) {
    alert("Enter all fields!");
    res.send("Blank field");
  }
  if (password != repassword) {
    alert("Password doesn't match!");
    console.log(password);
    console.log(repassword);
    res.send("password doesn't match");
  } else {
    //form passed
    db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2)",
      [username, hashedPassword],
      (err) => {
        if (err) {
          console.log(err);
          alert(err);
          return;
        }
        res.redirect("../login.html");
      }
    );
  }
});

app.get("/api/logout", (req, res) => {
  req.session.destroy();
  res.redirect("../login.html");
});

app.post("/api/search_from_user", (req, res) => {
  const { title, username } = req.body;
  console.log(username);
  const query = `SELECT 
        m.title, 
        TO_CHAR(m.release_date, 'dd Month yyyy'), 
        m.runtime, 
        g.genre_name, 
        CASE
            WHEN u.round IS NOT NULL THEN CONCAT(u.round, '/10 (', v.count, ')')
            ELSE NULL
        END AS wmd_rating,
        r.user_rating,
        s.status
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
    LEFT JOIN
        (SELECT * FROM users_mov_statuses WHERE username = '${username}') AS s 
        ON s.movie_id = m.movie_id
    WHERE lower(m.title) SIMILAR TO '(${title}%|%${title}%|%${title})';`; // at the start, middle or end

  db.query(query, (err, results) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(results.rows);
    res.status(200).send(results.rows);
  });
});

app.post("/api/search_from_admin", (req, res) => {
  const { title } = req.body;

  const query = `SELECT 
        m.movie_id,
        m.title, 
        TO_CHAR(m.release_date, 'dd Month yyyy'), 
        m.runtime, 
        g.genre_name, 
        CASE
            WHEN u.round IS NOT NULL THEN CONCAT(u.round, ' /10 (', v.count, ')')
            ELSE NULL
        END AS wmd_rating
    FROM 
        movies AS m 
    INNER JOIN 
        genres AS g 
        ON m.genre_id = g.genre_id 
    LEFT JOIN 
        (SELECT movie_id, ROUND(AVG(user_rating), 2) FROM users_ratings GROUP BY movie_id) AS u
        ON u.movie_id = m.movie_id
    LEFT JOIN
        (SELECT movie_id, COUNT(movie_id) FROM users_ratings GROUP BY movie_id) AS v
        ON v.movie_id = m.movie_id
    WHERE lower(m.title) SIMILAR TO '(${title}%|%${title}%|%${title})';`; // at the start, middle or end

  db.query(query, (err, results) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(results.rows);
    res.status(200).send(results.rows);
  });
});

app.post("/api/update_status", (req, res) => {
  const jsonArray = req.body;
  console.log(jsonArray);
  var query = "";

  // form the query
  for (var i = 0; i < jsonArray.length; i++) {
    //console.log(jsonArray[i])
    var { username, status, title } = jsonArray[i];
    // delete row if status null/radio button is both unchecked
    if (status == null) {
      query += `DELETE FROM users_mov_statuses 
            WHERE username = '${username}' AND movie_id = (SELECT movie_id FROM movies WHERE title = '${title}');`;
    }
    // otherwise insert/update status
    else {
      query += `INSERT INTO users_mov_statuses (username, status, movie_id) VALUES 
                ('${username}', ${status}, (SELECT movie_id FROM movies WHERE title = '${title}')) 
                ON CONFLICT (username, movie_id) DO UPDATE SET status = ${status};
            `;
    }
  }
  //console.log(query)
  db.query(query, (err, results) => {
    if (err) {
      console.log(err);
      res.status(503).send({ status: "ERROR" });
      return;
    }
    console.log("Status is Updated!");
    //console.log(results.rows);
    res.status(200).send({ status: "OK" });
  });
});

db.connect((err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`Connected to ${process.env.DB_DATABASE}`);
});

app.listen(8080, () => {
  console.log(`Server is running on port ${PORT}`);
});
