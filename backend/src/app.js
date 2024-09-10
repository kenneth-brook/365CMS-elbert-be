const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const setupRoutes = require('./routes/setupRoutes');
const authRoutes = require('./routes/authRoutes');
const trippingAuth = require('./routes/trippingAuth');
const role = require('./routes/role');
const formSubmissionRoutes = require('./routes/formSubmissionRoutes');
const categoryTypeRoutes = require('./routes/categoryTypeRoutes');
const menuTypesRoutes = require('./routes/menuTypesRoutes');
const averageCostRoutes = require('./routes/averageCostRoutes');
const eatFormRoutes = require('./routes/eatFormRoutes');
const playFormRoutes = require('./routes/playFormRoutes');
const shopFormRoutes = require('./routes/shopFormRoutes');
const stayFormRoutes = require('./routes/stayFormRoutes');
const tableRoutes = require('./routes/tableRoutes');
const eventFormRoutes = require('./routes/eventFormsRoutes');
const eventGetRoutes = require('./routes/eventGetRoute');
const usersRoutes = require('./routes/usersRoutes');
const addUserRoutes = require('./routes/addUserRoutes');
const typeNamesRoutes = require('./routes/typeNamesRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');
const googlePlaceRoutes = require('./routes/googlePlaceRoutes');

const app = express();
app.use(cookieParser());

const corsOptions = {
  origin: 'https://elbert.365easyflow.com', // Only allow this URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,  // Allow credentials such as cookies, authorization headers
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200  // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/login', authRoutes);
app.use('/auth', trippingAuth);
app.use('/setup', setupRoutes);
app.use('/user-role', role);
app.use('/form-submission', formSubmissionRoutes);
app.use('/category-type', categoryTypeRoutes);
app.use('/menu-types', menuTypesRoutes);
app.use('/average-costs', averageCostRoutes);
app.use('/eat-form-submission', eatFormRoutes);
app.use('/play-form-submission', playFormRoutes);
app.use('/shop-form-submission', shopFormRoutes);
app.use('/stay-form-submission', stayFormRoutes);
app.use('/data', tableRoutes);
app.use('/event-form-submission', multer().none(), eventFormRoutes);
app.use('/get-events', eventGetRoutes);
app.use('/type-names', typeNamesRoutes);
app.use('/itinerary', itineraryRoutes);
app.use('/users', usersRoutes);
app.use('/add-user', addUserRoutes);
app.use('/google', googlePlaceRoutes);

app.get('/test', (req, res) => {
  res.status(200).send(`Test path hit`);
});

app.get('*', (req, res) => {
    res.status(200).send(`You hit path: ${req.path}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
      message: 'Internal Server Error',
      error: err.message, // Provide error message for easier debugging
  });
});

module.exports = app;
