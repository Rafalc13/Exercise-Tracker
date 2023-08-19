const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose =  require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});
const User = mongoose.model('User', userSchema);

const exersiceSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  description: String,
  duration: Number,
  date: Date
});
const Exercise = mongoose.model('Exercise', exersiceSchema);

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.get('/api/users' , async (req, res) => {
  const user = await User.find({}).select('_id username');
  if(!user) {
    res.send('no user');
  }else {
    res.json(user);
  }
});
app.post('/api/users', async (req, res) => {
  const newuser = new User({
    username: req.body.username
  })
  try{
    const user = await newuser.save();
    console.log(user);
    res.json(user);
  }catch(err) {
    console.log(err);
  }
})
    
app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const {description, duration, date} = req.body;
  try{
    const user = await User.findById(id);
    if(!user) {
      res.send("not find user")
    }else {
      const newexercise = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })
      const exercise = await newexercise.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
  }catch(err) {
    console.log(err);
    res.send('there was an error');
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;
  const user = await User.findById(id);
  if(!user) {
    res.send('not user');
    return
  }
  const filter = {user_id: id};
  if(from || to) {
    filter.date = {};
    if(from) {
      filter.date.$gte = new Date(from);
    }
    if(to) {
      filter.date.$lte = new Date(to);
    }
  }
  const exercises = await Exercise.find(filter).limit(+limit || 500)

  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))
  res.json({
    username: user.username,
    _id: user._id,
    count: exercises.length,
    log    
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
