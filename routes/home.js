var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.send({
      title:"This is some default action"
  });
});

/* GET Hello World page. */
router.get('/model', function(req, res) {
    var model = require('../models/home/somemodel')();
    model.setName('Name set in action');
    res.send(model.toJson());
});

module.exports = router;
