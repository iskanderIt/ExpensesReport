
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

    var queryModel = {
        date: new Date(),
        offset:
            {
                amount: "",
                unit: "",
            }
    };


    app.post('/analytic/save', function (req, res) {

        res.redirect('analytic/get', {});
    });

    app.get('/analytic/query', function (req, res) {
        res.render('analytic/query', { model: queryModel });
    })

    app.post('/analytic/query', function (req, res) {
        var model = req.body.model;

        var unit = model.offset.unit,
            millis = model.offset.amount * 86400000,
            offset = unit == "d" ? millis : (unit == "m" ? millis * 30 : millis * 365),
            startDate = model.date != "" ? model.date : -1,
            endDate = (startDate != -1) ? (new Date(startDate)).getTime() + offset : new Date().getTime(),

            categories = model.categories,

            gIndex = "dmy".lastIndexOf(model.granularity),

            granularity = gIndex != -1 ? model.granularity : "y";

        switch (gIndex) {
            case 0:
                groupBy = { y: "$dyear", m: "$dmonth", d: "$dday" };
                match = {
                        $match: {
                            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                        }
                     };
                break;
            case 1:
                groupBy = { y: "$dyear", m: "$dmonth" };
                match = {
                    $match: {
                        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    }
                };
                break;
            case 2:
                groupBy = { y: "$dyear" };
                match = {
                    $match: {
                        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    }
                };
                break;
            default:
                groupBy = "$categories";
                match = {
                    $match: {
                        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                        //categories: categories,
                    }
                };
        }

        console.info("gIndex: %s - group by %s", gIndex,groupBy);

        var project =
        {
            $project: {
                categories: 1,
                amountIn: 1,
                amountOut: 1,
                date: 1,
                dday: { $dayOfMonth: "$date" },
                dmonth: { $month: "$date" },
                dyear: { $year: "$date" },
            }
        },
        sort =
        {
            $sort: { "_id.m": 1 }
        },
        group =
        {
            $group: {
                _id: groupBy,
                date: { $min: "$date" },
                categories: { $addToSet: "$categories" },
                size: { $sum: 1 },
                amountIn: { $sum: "$amountIn" },
                amountOut: { $sum: "$amountOut" }
            }
        };


        var opt = [project, group, match, sort];

        if (groupBy == "$categories")
            opt = [project, group, match ];

        //res.json(opt);
        //return;

        Operation.aggregate(opt, function (err, data) {

            //res.json([startDate, endDate, offset]);
            //res.json([project, match, group]);
            
            if (!err)
                res.json(data);
            else
                res.json(err);

        });
    });
}