const MongoStore = require("connect-mongo");

module.exports = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DB,
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
};
