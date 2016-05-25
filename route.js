module.exports = function(express, app, models, settings) {

	/*------
	Loading and strapping bitbucket ci route onto app.

	Example URL's
	http://test.yourapp.com:port/ci/bitbucket/push/branch/develop
	http://yourapp.com/ci/bitbucket/push/branch/master
	------------*/

	var routerBitbucket = new require('./route-bitbucket.js')(express, app, models, settings);
	app.use('/' + settings.key + '/bitbucket', routerBitbucket);

	/*------
	Returning App (ensuring app waterfalls)
	------------*/

	return app;

};