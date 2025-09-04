// index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const cors = require('cors');
const User = require('./models/User');
const bcrypt = require("bcryptjs");

dotenv.config();
const app = express();

// Middleware
app.set('view engine', 'ejs');
app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB Session Store
const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: 'sessions'
});

app.use(session({
    secret: 'This is a secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));

const checkAuth=(req,res,next)=>{
    if(req.session.isAuthenticated){
        return next();
    }
    else{
        return res.redirect('/login');
    }
}

// Routes
app.get('/',(req,res)=>{
    res.render('welcome')
})

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/home', checkAuth,(req, res) => {
    res.render('home');
});

// Register Route
app.post('/register', async (req, res) => {
    const { username, email, password, usertype } = req.body;
    
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        user = new User({
            username,
            email,
            password: hashedPassword,
            usertype
        });

        await user.save();
        res.redirect('/login');
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).send("Server error");
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.redirect('/register');
        }

        const checkPassword = await bcrypt.compare(password, user.password);
        if (!checkPassword) {
            return res.redirect('/login');
        }

        // Save session
        req.session.isAuthenticated = true;
        req.session.user = {
            id: user._id,
            username: user.username,
            usertype: user.usertype
        };
 
        // Redirect based on role
        if (user.usertype === "admin") {
            res.redirect('/admin');
        } else {
            res.redirect('/homeuser');
        }

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Server error");
    }
});

app.get('/homeuser', checkAuth, (req, res) => {
    if (req.session.user.usertype === "user") {
        res.render('homeuser');
    } else {
        res.redirect('/admin');
    }
});

app.get('/admin', checkAuth, (req, res) => {
    if (req.session.user.usertype === "admin") {
        res.render('adminuser');
    } else {
        res.redirect('/homeuser');
    }
});


app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).send("Logout failed");
        }
        res.redirect('/');
    });
});


// DB Connection + Server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("✅ Successfully connected to MongoDB!");
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`🚀 Server is running at 👉 http://localhost:${port}`);
});