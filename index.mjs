import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({ extended: true }));

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

app.get("/dbTest", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});//dbTest

app.listen(3000, () => {
    console.log("Express server running")
})


// CRUD helper functions

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
// if there is no state_name, then pass NULL into the function
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