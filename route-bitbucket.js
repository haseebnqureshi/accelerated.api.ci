module.exports = function(express, app, models, settings) {

	var child_process = require('child_process');

	var log = app.get('log');

	var router = express.Router();

	var model = models[settings.key].bitbucket;

	router.route('/:event/:type/:name')

		.post(function(req, res) {

			model
				.loadEnvVars()
				.ensureSetup()
				.savePayload(req.body)
				.summarizeEvent(req.params.event)
				.summarizeActor();
				
			model.pullIf(
				model.isEventType(req.params.type) 
				&& model.isEventName(req.params.name)
			);

			model.run();

			return res.status(200).send({
				message: 'Received webhook and processing ci request...',
				params: req.params,
				actor: model.getActor(),
				event: model.getEvent()
			});

		});

	return router;

};