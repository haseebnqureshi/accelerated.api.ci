module.exports = function(express, app, models, settings) {

	var child_process = require('child_process');

	var http = require('http');

	var querystring = require('querystring');

	var _ = require('underscore');

	var log = app.get('log');

	var router = express.Router();

	var model = models[settings.key].bitbucket;

	router.route('/:event/:type/:name')

		.post(function(req, res) {

			//return status immediately back
			res.status(200).send({
				message: 'Received webhook and processing ci request...'
			});

			//loading environment variables and grabbing payload information
			model
				.loadEnvVars()
				.savePayload(req.body)
				.summarizeEvent(req.params.event)
				.summarizeActor()
				.persistEvent();

			//emitting to other specified instances
			model.emit(req);

			//preparing our integration logic
			model.ensureSetup();
				
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