var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var moment = require('moment');
var bearer = require('bearer');
var pg = require('pg');
var helper=require('./helper');

var app = express();

// view engine setup

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());

//Setup authentication
//This should be done before all routes are configured to assure that authorization will be first to execute
bearer({
    //Make sure to pass in the app (express) object so we can set routes
    app:app,
    //Please change server key for your own safety!
    serverKey:"12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678",
    tokenUrl:'/token', //Call this URL to get your token. Accepts only POST method
    extendTokenUrl:'/extendtoken', //Call this URL to get your token. Accepts only POST method
    createToken:function(req, next, cancel){
        //If your user is not valid just return "underfined" from this method.
        //Your token will be added to req object and you can use it from any method later
        var username=req.body.username;
        var password=req.body.password;
        var client=new pg.Client(helper.connString);

        client.on('drain', client.end.bind(client));
        client.connect();
        client.query('select password from users where username=$1 and enabled=true', [username], function(err, result){
            if(!err) {
                if (result.rowCount>0){
                    var decPass=helper.decrypt(result.rows[0].password, helper.cryptoKey);
                    if (decPass==password){
                        next({
                            expire: moment(Date.now()).add('days', 1).format('YYYY-MM-DD HH:mm:ss'),
                            username: username,
                            contentType: req.get('Content-Type'),
                            ip: req.ip,
                            userAgent: req.header('user-agent'),
                            custom_id: '55555',
                            another: 'Some data you need in your token',
                            moreData: 'Some more data you need'
                        });
                        return;
                    }
                }
            }
            cancel();
        });
    },
    extendToken:function(req, next, cancel){
        var token=req.authToken;
        if (token){
            next({
                expire: moment(Date.now()).add('days', 1).format('YYYY-MM-DD HH:mm:ss'),
                username: token.username,
                contentType: req.get('Content-Type'),
                ip: req.ip,
                userAgent: req.header('user-agent'),
                custom_id: '55555',
                another: 'Some data you need in your token',
                moreData: 'Some more data you need'
            });
        }else{
            cancel();
        }
    },
    validateToken:function(req, token){
        //you could also check if request came from same IP using req.ip==token.ip for example
        if (token){
            return moment(token.expire)>moment(new Date());
        }
        return false;
    },
    onTokenValid:function(token, next, cancel){
        //This is in case you would like to check user account status in DB each time he attempts to do something.
        //Doing this will affect your performance but its your choice if you really need it
        //Returning false from this method will reject user even if his token is OK
        var username=token.username;
        var client=new pg.Client(helper.connString);
        client.on('drain', client.end.bind(client));
        client.connect();
        client.query('select enabled from users where username=$1', [username], function(err, result){
            if(!err) {
                if (result.rows[0].enabled===true){
                    next();
                }else
                {
                    cancel();
                }
            }else
            {
                cancel();
            }
        });
    },
    userInRole:function(token, roles, next, cancel){
        //Provide role level access restrictions on url
        //You can use onTokenValid for this also, but I find this easier to read later
        //If you specified "roles" property for any secureRoute below, you must implement this method
        var username=token.username;

        var client=new pg.Client(helper.connString);
        client.on('drain', client.end.bind(client));
        client.connect();

        var params=roles.map(function(rolename, i){
            return ('$'+(i+1));
        }).join(',');

        var paramArray=roles;
        paramArray.push(username);

        client.query('select count(*) from userroles where rolename in ('+params+') and username=$'+paramArray.length, paramArray, function(err, result){
            if(!err) {
                if (result.rows[0].count>0) {
                    next()
                }else
                {
                    cancel();
                }
            }else
            {
                cancel();
            }
        });
    },
    onAuthorized: function(req, token){
        //console.log("this will be executed if request is OK");
    },
    onUnauthorized: function(req, token){
        //console.log(req.path, "this will be executed if request fails authentication");
    },
    secureRoutes:[
        {url:'/account/getroles', method:'get', roles:["Administrator"]},
        {url:'/account/setpassword', method:'post', roles:["Administrator"]},
        {url:'/account/changepassword', method:'post'},
        {url:'/account/getusers', method:'get', roles:["Administrator"]},
        {url:'/account/getuser', method:'get', roles:["Administrator"]},
        {url:'/account/getuserroles', method:'get', roles:["Administrator"]},
        {url:'/account/adduserrole', method:'post', roles:["Administrator"]},
        {url:'/account/removeuserrole', method:'post', roles:["Administrator"]},
        {url:'/account/changeuser', method:'post'},
    ]
});

//Setup routing
require('./routes/route-config')(app);

module.exports = app;
