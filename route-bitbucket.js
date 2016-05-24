module.exports = function(express, app, models, settings) {

	var child_process = require('child_process');

	var log = app.get('log');

	var router = express.Router();

	var model = models[settings.key].bitbucket;

	router.route('/:event/:type/:name')

		.post(function(req, res) {

			model
				.config()
				.savePayload(req.body)
				.summarizeEvent(req.params.event)
				.summarizeActor();
				
			model.pullIf(
				model.isEventType(req.params.type) 
				&& model.isEventName(req.params.name)
			);


			//conditionally requiring repo's fullname to match
			if (process.env.CI_REPO_FULLNAME) { 
				model.pullIf(
					model.isEventRepoFullName(process.env.CI_REPO_FULLNAME)
				);
			}

			//conditionally requiring actor's username to match
			if (process.env.CI_ACTOR_USERNAME) { 
				model.pullIf(
					model.isActorUsername(process.env.CI_ACTOR_USERNAME)
				);
			}

			model.runAfter(1000);


			return res.status(200).send({
				message: 'Received webhook and processing ci request...',
				params: req.params,
				actor: model.getActor(),
				event: model.getEvent()
			});

		});

	return router;

};