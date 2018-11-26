var bodyParser = require('body-parser')
var express = require('express');
var fs = require('fs');
var http = require('http');
var path = require('path');
var expressValidator = require('express-validator');
const { check, validationResult } = require('express-validator/check');
var mongojs = require('mongojs');
var db = mongojs('psiApp', ['requests']);
var ObjectId= mongojs.ObjectId;
var request = require('request');
var moment = require('moment');

var app = express();

var logger = (req, res, next)=>{
    console.log('logging');
    next();
};

app.use(logger);

//View Engine
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

//Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//Global Vars
app.locals.errors = null;
app.set('api_url', 'https://api.data.gov.sg/v1/environment/psi?date=');
app.set('query_date', '') ;

//Set Static Path
app.use(express.static(path.join(__dirname, 'public')));

app.get('/',(req, res) => {
    var title = 'PSI : Visualised';
    var api_url = app.get('api_url');
    var query_date = app.get('query_date');
    var xLabel = [];
    var yLabel = [];
    var backgroundColor = [];
    var current_psi_value = '';
    var current_psi_color = '';
    var current_psi_timestamp = '';
    function assignColor(psi){
        if (psi <= 50){
            return('#479b02');
        }else if(psi <= 100){
            return('#006fa1');
        }else if (psi <= 200) {
            return('#FFCE03');
        }else if (psi <= 300) {
            return('#FFA800');
        }else {
            return('#d60000');
        }
    }
    var curDateString = moment().format('YYYY-MM-DD');
    cur_api_url = app.get('api_url') + curDateString;
    console.log(cur_api_url);
    request(cur_api_url, function (error, response) {
        if (response != undefined && response.statusCode == 200){
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            body = JSON.parse(response.body);
            current_psi_value = body.items[body.items.length - 1].readings.psi_twenty_four_hourly.central;
            current_psi_timestamp = body.items[body.items.length - 1].timestamp;
        }
        if (query_date) {
            api_url += query_date;
            request(api_url, function (error, response) {
                if (response != undefined && response.statusCode == 200) {
                    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                    body = JSON.parse(response.body);
                    body.items.forEach(item => {
                        var date = new Date(item.timestamp);
                        hourString = date.getHours() + ':00';
                        xLabel.push(hourString);
                        yLabel.push(item.readings.psi_twenty_four_hourly.central);
                        backgroundColor.push(assignColor(item.readings.psi_twenty_four_hourly.central));
                    });
                    res.render('index', {
                        'title': title,
                        'body': body,
                        'errors': app.get('errors'),
                        'xLabel': xLabel,
                        'yLabel': yLabel,
                        'backgroundColor': backgroundColor,
                        'current_psi_value': current_psi_value,
                        'current_psi_color': current_psi_color,
                        'current_psi_timestamp': current_psi_timestamp,
                    });
                }
            });
        } else {
            res.render('index', {
                'title': title,
                'body': { region_metadata: [], items: [] },
                'errors': app.get('errors'),
                'xLabel': xLabel,
                'yLabel': yLabel,
                'backgroundColor': backgroundColor,
                'current_psi_value': current_psi_value,
                'current_psi_color': current_psi_color,
                'current_psi_timestamp': current_psi_timestamp,
            });
        }
    });
});

app.post('/request/add',[
    // check('datepicker').isLength({ min: 2 }).withMessage('Month must be at least 2 chars long'), .matches(/\d/).withMessage('First Name must contain a number')
],(req, res) =>{
    var result = validationResult(req);
    var errors = result.array();
    if (!result.isEmpty()) {
       app.set('errors',errors);
       res.redirect('/');
    }else{
        var newQuery = {
            psiDateTime: req.body.datepicker,
            queryDateTime: Date.now()
        };
        db.requests.insert(newQuery);
        app.set('query_date', req.body.datepicker);
        res.redirect('/');
    }
});

app.delete('/users/delete/:id',function(req, res){
    console.log(req.params.id);
    db.users.remove({ _id: ObjectId(req.params.id)},(err)=>{
        if (err){
            console.log(err);
        }
    });
});

app.listen(3000, () => {
    console.log('Server started on port 3000!');
});