import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();
// bcrypt hashing rounds
const saltRounds = 10;

// defaults for user profiles
const defaultProfilePicture = "placeholder";
const defaultTempUnit = "F";

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// express-session settings
app.set('trust proxy', 1);
app.use(session({
    secret: 'weather-based-trip-organizer-session-secret',
    resave: false,
    saveUninitialized: true
}));

//setting up database connection pool
const pool = mysql.createPool({
    host: "etdq12exrvdjisg6.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "hfg9ev72jeqyfrle",
    password: "cf9gfu5jm50yq078",
    database: "ocdzfra4snfqf72t",
    connectionLimit: 10,
    waitForConnections: true
});

//routes
app.get('/', (req, res) => {
    res.send('Hello Express app!')
});


// login page
app.get('/login', (req, res) => {
    res.render("login");
});

// login post route
app.post('/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    // console.log(username);
    // console.log(password);

    let userAccount = await getUserByUsername(username);

    if (!userAccount) {
        console.log("User not found");
        return res.render("login", { error: "User not found" });
    }

    let userPass = userAccount.password;

    let match = await bcrypt.compare(password, userPass);

    // console.log(userAccount);
    // console.log(userPass);

    if (match) {
        console.log("Login successful");
        req.session.authenticated = true;
        req.session.userId = userAccount.user_id;
        req.session.username = userAccount.username;
        req.session.profilePicturePath = userAccount.profile_picture_path;
        req.session.tempUnit = userAccount.temp_unit;

        // console.log(req.session.userId);
        // console.log(req.session.username);
        // console.log(req.session.profilePicturePath);
        // console.log(req.session.tempUnit);

        res.render("login"); // TODO: CHANGE TO INDEX
    } else {
        console.log("Incorrect password");
        res.render("login", { error: "Incorrect password" });
    }
});

// register post route
app.post('/register', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let passConfirm = req.body.passConfirm;

    // confirm password
    if (password != passConfirm) {
        console.log("Passwords do not match");
        return res.render("login", { error: "Passwords do not match" });
    }

    // check username availability
    let existingUser = await getUserByUsername(username);
    if (existingUser) {
        console.log("Username is taken");
        return res.render("login", { error: "Username already taken" });
    }

    let hashedPassword = await bcrypt.hash(password, saltRounds);

    await addUser(username, hashedPassword, defaultProfilePicture, defaultTempUnit);

    let userAccount = await getUserByUsername(username);

    console.log("Account creation successful");
    req.session.authenticated = true;
    req.session.userId = userAccount.user_id;
    req.session.username = userAccount.username;
    req.session.profilePicturePath = userAccount.profile_picture_path;
    req.session.tempUnit = userAccount.temp_unit;

    // console.log(req.session.userId);
    // console.log(req.session.username);
    // console.log(req.session.profilePicturePath);
    // console.log(req.session.tempUnit);

    res.render("login"); // TODO: CHANGE TO INDEX
});

// logout route
app.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy();
    res.redirect("login"); // TODO: CHANGE TO INDEX
});

app.get("/dbTest", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});//dbTest


//favorites route
app.get("/favorites", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

    // use your helper function 
    let favorites = await getFavDaysByUserId(userId);

    // attach notes to each favorite
    for (let fav of favorites) {
      let notes = await getNotesByDay(fav.day_id);
      fav.notes = notes;

      if (typeof fav.weather_data === "string") {
        try {
          fav.weather_data = JSON.parse(fav.weather_data);
        } catch {
          fav.weather_data = {};
        }
      }
    }

    res.render("favorites", { favorites });

  } catch (error) {
    console.error(error);
    res.send("Error loading favorites");
  }
});

//update notes route
app.post("/notes/update", async (req, res) => {
  try {
    const { note_id, note_text, icon_path, note_title } = req.body;

    const success = await updateNote(
      note_text,
      icon_path,
      note_title,
      note_id
    );

    res.json({ success });
  } catch (error) {
    console.error("Note update error:", error);
    res.json({ success: false });
  }
});

//add notes route
app.post("/notes/add", async (req, res) => {
  try {
    const { day_id, note_text, icon_path, note_title } = req.body;

    const noteId = await addNote(day_id, note_text, icon_path, note_title);

    res.json({ success: true, noteId });
  } catch (error) {
    console.error("Note add error:", error);
    res.json({ success: false });
  }
});

//delete notes
app.post("/notes/delete", async (req, res) => {
  try {
    const { note_id } = req.body;
    const success = await deleteNote(note_id);
    res.json({ success });
  } catch (err) {
    console.error("Delete error:", err);
    res.json({ success: false });
  }
});

app.listen(3000, () => {
    console.log("Express server running")
})

// FUNCTIONS

// authentication helper
function isAuthenticated(req, res, next) {
    if (!req.session.authenticated) {
        res.redirect("login"); // TODO: CHANGE TO INDEX
    } else {
        next();
    }
}


// CRUD HELPER FUNCTIONS

// INSERT HELPERS

// add new user to database
// returns new userId
async function addUser(username, password, picture, tempUnit) {

    let params = [username, password, picture, tempUnit];
    let sql = `
        INSERT INTO users
        (username, password, profile_picture_path, temp_unit)
        VALUES (?, ?, ?, ?)`;

    const [result] = await pool.query(sql, params);
    return result.insertId;
}

// add new favorite day to database
// if there is no state_name, then pass NULL into the function, the helper deals with it
// returns new day_id
async function addFavDay(user_id, country_name, state_name, city_name, longitude, latitude, weather_data, day_date) {
    let validState = state_name ?? "";

    let params = [user_id, country_name, validState, city_name, longitude, latitude, weather_data, day_date];
    let sql = `
        INSERT INTO favorite_days
        (user_id, country_name, state_name, city_name, longitude, latitude, weather_data, day_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await pool.query(sql, params);
    return result.insertId;
}

// add new note to database
// returns new note_id
async function addNote(day_id, note_text, icon_path, note_title) {

    let params = [day_id, note_text, icon_path, note_title];
    let sql = `
        INSERT INTO notes
        (day_id, note_text, icon_path, note_title)
        VALUES (?, ?, ?, ?)`;

    const [result] = await pool.query(sql, params);
    return result.insertId;
}

// UPDATE HELPERS

// update user preferences
// returns true if it affects any rows (should be 1), false if not
async function updateUserPrefs(profile_picture_path, temp_unit, user_id) {
    let sql = `
        UPDATE users
        SET profile_picture_path= ?,
            temp_unit = ?
        WHERE user_id = ?`;

    let params = [profile_picture_path, temp_unit, user_id];

    const [result] = await pool.query(sql, params);
    return result.affectedRows > 0;
}

// update note
// returns true if it affects any rows (should be 1), false if not
async function updateNote(note_text, icon_path, note_title, note_id) {
    let sql = `
        UPDATE notes
        SET note_text= ?,
            icon_path = ?,
            note_title = ?
        WHERE note_id = ?`;

    let params = [note_text, icon_path, note_title, note_id];

    const [result] = await pool.query(sql, params);
    return result.affectedRows > 0;
}

// DELETE HELPERS

// delete favorite day
// returns true if it affects any rows (should be 1), false if not
async function deleteFavDay(day_id) {
    let sql = `
        DELETE
        FROM favorite_days
        WHERE day_id = ?`;

    const [result] = await pool.query(sql, [day_id]);
    return result.affectedRows > 0;
}

// delete note
// returns true if it affects any rows (should be 1), false if not
async function deleteNote(note_id) {
    let sql = `
        DELETE
        FROM notes
        WHERE note_id = ?`;

    const [result] = await pool.query(sql, [note_id]);
    return result.affectedRows > 0;
}

// SELECT HELPERS

// select user from users
// returns user_id's row data
async function getUserById(user_id) {
    const sql = `
        SELECT *
        FROM users
        WHERE user_id = ?`;

    const [rows] = await pool.query(sql, [user_id]);
    return rows[0] || null;
}

// select user from users
// returns username's row data
async function getUserByUsername(username) {
    const sql = `
        SELECT *
        FROM users
        WHERE username = ?`;

    const [rows] = await pool.query(sql, [username]);
    return rows[0] || null;
}

// select day from favorite_days
// returns day_id's row data
async function getDay(day_id) {
    const sql = `
        SELECT *
        FROM favorite_days
        WHERE day_id = ?`;

    const [rows] = await pool.query(sql, [day_id]);
    return rows[0] || null;
}

// select all days for a user
// returns array of rows containing all days
async function getFavDaysByUserId(user_id) {
    const sql = `
        SELECT *
        FROM favorite_days
        WHERE user_id = ?
        ORDER BY day_date DESC`;

    const [rows] = await pool.query(sql, [user_id]);
    return rows;
}

// select day and all of its notes
// returns the notes nested as an array within the day's data
async function getDayWithNotes(day_id) {
    const day = await getDay(day_id);
    if (!day) return null;

    const notes = await getNotesByDay(day_id);

    return { ...day, notes };
}

// select note from notes
// returns note_id's row data
async function getNote(note_id) {
    const sql = `
        SELECT *
        FROM notes
        WHERE note_id = ?`;

    const [rows] = await pool.query(sql, [note_id]);
    return rows[0] || null;
}

// select all notes for a day
// returns array of rows containing all notes
async function getNotesByDay(day_id) {
    const sql = `
        SELECT *
        FROM notes
        WHERE day_id = ?`;

    const [rows] = await pool.query(sql, [day_id]);
    return rows;
}