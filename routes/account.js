var express = require('express');
var router = express.Router();
var helper=require('../helper');
var pg = require('pg');

router.get('/getroles', function(req, res) {
    pg.connect(helper.connString, function(err, client, done) {
        if(err) {
            res.send(err);
        }
        client.query('select rolename from roles', null, function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                res.send(err);
            }
            res.send(result.rows);
        });
    });
});

router.post('/createuser', function(req, res) {
    var username=req.body.username;
    var password=helper.encrypt(req.body.password, helper.cryptoKey);
    var fullname=req.body.fullname;
    var email=req.body.email;

    pg.connect(helper.connString, function(err, client, done) {
        if(err) {
            res.send(err);
        }
        client.query('INSERT INTO users(username, password, fullname, email) VALUES ($1, $2, $3, $4)', [username, password, fullname, email], function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                res.send(err);
            }
            res.send({
                username:username,
                fullName:fullname,
                email:email
            });
        });
    });
});

router.post('/setpassword', function(req, res) {
    var username=req.body.username;
    var password=helper.encrypt(req.body.password, helper.cryptoKey);

    pg.connect(helper.connString, function(err, client, done) {
        if(err) {
            res.send(err);
        }
        client.query('update users set password=$2 where username=$1', [username, password], function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                res.send(err);
            }
            res.send({
                rowCount:result.rowCount
            });
        });
    });
});

router.post('/changepassword', function(req, res) {
    var username=req.body.username;
    var oldpassword=req.body.oldpassword;
    var password=helper.encrypt(req.body.password, helper.cryptoKey);
    var loggedUser=req.authToken.username;

    if (loggedUser!=username){
        res.statusCode=400;
        res.send({
            error:"Wrong user"
        });
        return;
    }

    pg.connect(helper.connString, function(err, client, done) {
        if(err) {
            done();
            res.send(err);
            return;
        }
        client.query('select username, password from users where username=$1', [username], function(err, result) {
            if(err) {
                done();
                res.send(err);
                return;
            }
            if (result.rowCount==0){
                done();
                res.statusCode=400;
                res.send({error:"User not found"});
                return;
            }
            var decPass=helper.decrypt(result.rows[0].password, helper.cryptoKey);
            if (decPass==oldpassword){
                client.query('update users set password=$2 where username=$1', [username, password], function(err, result) {
                    done();

                    if(err) {
                        res.send(err);
                    }
                    res.send({
                        rowCount:result.rowCount
                    });
                });
            }else
            {
                done();
                res.statusCode=400;
                res.send({error:"Passwords don't match"});
            }
        });
    });
});

router.post('/changeuser', function(req, res) {
    var username=req.body.username;
    var fullname=req.body.fullname;
    var email=req.body.email;

    var loggedUser=req.authToken.username;

    if (loggedUser!=username){
        res.statusCode=400;
        res.send({
            error:"Wrong user"
        });
        return;
    }

    pg.connect(helper.connString, function(err, client, done) {
        if(err) {
            done();
            res.send(err);
            return;
        }
        client.query('update users set fullname=$2, email=$3 where username=$1', [username, fullname, email], function(err, result) {
            done();

            if(err) {
                res.send(err);
            }
            res.send({
                rowCount:result.rowCount
            });
        });
    });
});

router.get('/getusers', function(req, res) {
    pg.connect(helper.connString, function(err, client, done) {
        if(err) {
            res.send(err);
        }
        client.query('select username, fullname, email from users', null, function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                res.send(err);
            }
            res.send(result.rows);
        });
    });
});

router.get('/getuser', function(req, res) {
    var username=req.query.username;
    pg.connect(helper.connString, function(err, client, done) {
        if(err) {
            res.send(err);
        }
        client.query('select username, fullname, email from users where username=$1', [username], function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                res.send(err);
            }
            res.send(result.rows);
        });
    });
});

router.get('/getuserroles', function(req, res) {
    var username=req.query.username;
    pg.connect(helper.connString, function(err, client, done) {
        if(err) {
            res.send(err);
        }
        client.query('select rolename from userroles where username=$1', [username], function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                res.send(err);
            }
            res.send(result.rows);
        });
    });
});

router.post('/adduserrole', function(req, res) {
    var username=req.body.username;
    var rolename=req.body.rolename;
    pg.connect(helper.connString, function(err, client, done) {
        if(err) {
            res.send(err);
        }
        client.query('insert into userroles (username, rolename) values ($1, $2)', [username, rolename], function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                res.send(err);
                return;
            }
            res.send({
                rowCount:result.rowCount
            });

        });
    });
});

router.post('/removeuserrole', function(req, res) {
    var username=req.body.username;
    var rolename=req.body.rolename;
    pg.connect(helper.connString, function(err, client, done) {
        if(err) {
            res.send(err);
        }
        client.query('delete from userroles where username=$1 and rolename=$2', [username, rolename], function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                res.send(err);
                return;
            }
            res.send({
                rowCount:result.rowCount
            });
        });
    });
});


module.exports = router;

