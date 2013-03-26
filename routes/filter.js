module.exports = function (app) {
    app.get('*/report/*', function (req, res, next) {
        //console.log(req.params);
        if (!req.user) {
            res.render('account/login', { title: 'login' });
            return;
        }
        return next();
    });

    app.get('*/operation/*', function (req, res, next) {
        //console.log(req.params);
        if (!req.user) {
            res.render('account/login', { title: 'login' });
            return;
        }
        return next();
    });

    app.get('*/analytic/*', function (req, res, next) {
        //console.log(req.params);
        if (!req.user) {
            res.render('account/login', { title: 'login' });
            return;
        }
        return next();
    });
}