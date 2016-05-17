module.exports = function(express, app, models, settings) {

	/*------
	Loading and strapping bitbucket ci route onto app.
	------------*/

	var routerBitbucket = require('./route-bitbucket.js')(express, app, models, settings);
	app.use('/' + settings.key + '/bitbucket', routerBitbucket);

	/*------
	Loading and strapping bitbucket ci route onto app.
	------------*/

	var routerGithub = require('./route-github.js')(express, app, models, settings);
	app.use('/' + settings.key + '/github', routerGithub);

	/*------
	Returning App (ensuring app waterfalls)
	------------*/

	return app;

};