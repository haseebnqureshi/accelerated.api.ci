module.exports = function(express, app, models, settings) {

	var child_process = require('child_process');

	var http = require('http');

	var querystring = require('querystring');

	var _ = require('underscore');

	var log = app.get('log');

	var router = express.Router();

	var model = models[settings.key].bitbucket;

	var emit = function(req) {

		log.get().info('Attempting to emit event to other instances...');

		/*
		Use this as proxy, rely back to network urls with same 
		incoming request. This NEEDS to happen with multiple instances
		behind one load balancer. The network urls defined in env.json
		are ideally private IPs made available to this box, but not 
		to the outside world.
		*/

		var postData = querystring.stringify(req.body);

		var options = {
			path: req.originalUrl,
			method: 'POST',
			headers: req.headers
		};

		_.each(model.getConfig().NETWORK, function(url) {
			try {
				var thisOptions = _.clone(options);
				var match = url.match(/\/\/([^\:]+)\:?([0-9]+)?/);
				thisOptions.hostname = match[1];
				thisOptions.port = match[2] || 80;

				/*
				Right now, emitting to other networked instances require
				each instance to have port 80 open to this box. 
				*/

				var thisRequest = http.request(thisOptions);
				thisRequest.write(postData);
				thisRequest.end();
			}
			catch (err) {
				log.get().error('Could not emit event to instance!');
				log.get().error({ url: url });
			}
		});
	};

	router.route('/:event/:type/:name')

		.post(function(req, res) {

			//return status immediately back
			res.status(200).send({
				message: 'Received webhook and processing ci request...'
			});

			//loading environment variables
			model.loadEnvVars();

			//emitting to other specified instances
			emit(req);

			//preparing our integration logic
			model
				.ensureSetup()
				.savePayload(req.body)
				.summarizeEvent(req.params.event)
				.summarizeActor();
				
			//now evaluating our ci request
			model.pullIf(
				model.isEventType(req.params.type) 
				&& model.isEventName(req.params.name)
			);

			//and executing our integration scripts, after some final checks
			model.run();

		});

	return router;

};