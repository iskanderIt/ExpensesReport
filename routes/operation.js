
module.exports = function (app) {

    var mongoose = require('mongoose')
    var opts = { server: { poolSize: 1, auto_reconnect: false, }, user: 'bilancionode', pass: 'bilancionode', db: 'heroku_app13755504' };
    var opSchema = new mongoose.Schema({
        id: String,
        // data operazione
        date: Date,
        // data scalo 
        dateTransition: Date,
        description: String,
        amountOut: Number,
        amountIn: Number,
        categories: Array,
    });

    var uri = "mongodb://localhost:27017/BilancioNode";

    if (process.env["MONGOLAB_URI"])
        uri = process.env["MONGOLAB_URI"];

    var Operation = mongoose.createConnection(uri).model("operation", opSchema);

    app.post('/operation/save', function (req, res) {

        var tmp = req.body;
        tmp.date = new Date(tmp.date);
        tmp.dateTransition = new Date(tmp.dateTransition);
        var obj = {};

        var id = tmp._id;

        for (var p in req.body)
            if (p != "_id")
                obj[p] = req.body[p];

        if (id == -1)
            Operation.create(obj, function (err, newObj) {
                if (err) {
                    console.error(err);
                    res.json({ ok: 0, msg: "error create" });
                }
                res.json(newObj);
            });
        else
            Operation.findByIdAndUpdate(id, obj,
                { upsert: true }, function (err) {
                if (err) {
                    console.error(err);
                    res.json({ok:0, msg:"error update"});
                }
                res.json(obj);
            });
    });

    app.post('/operation/delete', function (req, res) {
        var id = req.body._id;

        if (id < 0)
            res.json({ _id: id});

        Operation.findByIdAndRemove(id,{},function (err) {
            if (err) {
                res.json({ _id: id });
                console.error(err);
            }
            res.json({_id: -1});
        });
    });

    // user account page
    app.get('/operation/', function (req, res) {
        res.redirect('list');
    });

    app.get('/operation/get/:idp?', function (req, res) {

        var id = req.params.idp;

        Operation.findById(id, function (err, data) {
            var obj = data;
            if (obj == null)
                obj = {
                    _id: -1,
                    id: -1,
                    date: new Date(),
                    dateTransition: new Date(),
                    description: "",
                    amountOut: 0,
                    amountIn: 0,
                };
            res.render('operation/editor', { op: obj });
        });
    });

    app.get('/operation/list', function (req, res) {

        Operation.find(true, function (err, data) {
            //res.json(data);
            res.render('operation/list', { title: 'List', ops: data });
        });
    });
}