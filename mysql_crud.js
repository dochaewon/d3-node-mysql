var fs = require('fs');
var ejs = require('ejs');
var http = require('http');
var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var Promise = require('bluebird');
var winston = require('winston'); //로그모듈
var winstonDaily = require('winston-daily-rotate-file'); //일별 로그 모듈
var moment = require('moment'); //시간처리 모듈

winston.log('info', 'Hello from Winston!');
winston.info('This also works');

winston.log('info', 'Test Log Message', {
  anything: 'This is metadata'
});

var mySqlClient = mysql.createConnection({
  host: '192.168.10.210',
  user: 'root',
  password: '1q2w3e4r%T',
  database: 'KCC_LAB'
});
var queryAsync = Promise.promisify(mySqlClient.query.bind(mySqlClient));
mySqlClient.connect();
var app = express();
app.use(cors());
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
http.createServer(app).listen(8000, function() {
  console.log('Server running at http://127.0.0.1:8000');
});

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/list', function(req, res) {
  mySqlClient.query('select seq,keyword,FORMAT(tweets,0) AS tweets,size, DATE_FORMAT(date,"%Y년 %m월%d일 %H시%i분") AS date, DATE_FORMAT(sinceDate,"%Y년 %m월%d일 %H시%i분") AS sinceDate, DATE_FORMAT(latelyDate,"%Y년 %m월%d일 %H시%i분") AS latelyDate from Keyword_History', function(error, results) {
    if (error) {
      console.log('error:', error.message);
    } else {
      //console.log(results);
      results = JSON.stringify(results);
      results = JSON.parse(results);
      res.json(results)
    }
  })
})
app.get('/', function(req, res) {
  res.render('list.html')
});

app.get('/insert', function(req, res) {
  fs.readFile('views/insert.html', 'utf8', function(error, data) {
    if (error) {
      console.log('readFile Error');
    } else {
      res.send(data);
    }
  })
});

app.get('/:keyword/word', function(req, res) {
  var keyword_trim = req.params.keyword.trim();
  var query = "SELECT word, frequency FROM Word WHERE keyword = '" + keyword_trim + "' GROUP BY word ORDER BY frequency DESC LIMIT 600;";
  mySqlClient.query(query, function(error, result) {
    if (error) {
      console.log('error : ', error.message);
    } else {
      console.log("save!");
      result = JSON.stringify(result);
      res.json(result)
    }
  })
});
app.get('/:keyword', function(req, res) {
  //console.log("go to " + req.params.keyword);
  res.render('./word.html', {
    _keyword: req.params.keyword
  })
});

app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies
app.post('/insert', function(req, res) {
  mySqlClient.query('UPDATE Keyword_History SET status="n" WHERE  status="y";');
  mySqlClient.query('insert into Keyword_History(keyword,status)  values(?,"y")', [req.body.keyword],
    function(error, result) {
      if (error) {
        res.json({
          "result": "ERROR",
          "message": error
        });
      } else {
        res.json({
          "result": "SUCCESS",
          "message": "Success to register '" + req.body.keyword + "'",
          "response": result
        });
      }
    });
});
