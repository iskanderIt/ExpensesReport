
module.exports = function (app) {

    app.get('/report/annual', function (req, res) {
        res.json(process.env);
        return;

        res.render('report/annual', { title:'Annual Report', years: ["2013","2012","2011"]});
    });

    app.get('/report/montly', function (req, res) {

        res.render('report/montly', { title: 'Montly Report', years: ["2013", "2012", "2011"] });
    });

    app.get('/report/aggregate', function (req, res) {

        res.render('report/aggregate', { title: 'Aggregate Report', years: ["2013", "2012", "2011"] });
    });

}