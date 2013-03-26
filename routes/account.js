
module.exports = function (app) {

    // user account page
    app.get('/account', function (req, res) {
        res.render('account/account', { title: "Account" });
    });

    // login
    app.get('/login', function (req, res) {
        res.render('account/login', { user: req.user });
    });
    //logout intercettato da everyauth
}
