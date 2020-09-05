var express = require('express');
var app = express();

var request = require('request');
var bodyParser = require('body-parser');
const date = require('date-and-time');

const now = new Date();
console.log(date.format(now, 'ddd, MMM DD YYYY'));
console.log(date);

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

//to write home instead of home.ejs
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('search');
});

app.get('/results', function (req, res) {
  let city = req.query.city;
  let url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=089fcb9efb9ec5e6370ed78f4a243073`;
  console.log(req.body.city);
  console.log('0');
  request(url, function (err, response, body) {
    if (err) {
      console.log('4');
      res.render('search', { data: null, error: 'Error, please try again' });
    } else {
      console.log('5');
      let data = JSON.parse(body);
      if (data.main == undefined) {
        console.log('6');
        console.log(city);
        res.render('search', {
          data: null,
          error: 'Error, please try again',
        });
      } else {
        console.log('7');
        res.render('result', { data: data, error: null });
        console.log('body:', body);
      }
    }
  });
});

app.listen(3000, function () {
  console.log('Server listening on port 3000');
});
