module.exports = function(express app, models, settings) {

	var child_process = require('child_process');

	var logger = app.get('logger');

	var router = express.Router();

	router.route('/:event/:type/:name')

		.post(function(req, res) {

			switch (req.params.event) {
				case 'push':

					/*
					Now we check to see if our payload information matches
					our endpoint variables, so that the commits coming through
					are truly intended for the webhook.
					*/	

					try {
						var change = req.body.push.changes[0].new;
						var type = change.type;
						var name = change.name;

						//if our payload matches our webhook information, we go ahead
						if (req.params.type == type && req.params.name == name) {

							//to prevent any possible timeout with bitbucket's webhook, we send our status asap
							res.status(200).send({
								message: 'Hook received and will be updating our environment!'
							});

							logger.info('Starting process for pulling from ' + type + ' ' + name + '!');
							logger.warn('Git repo must have a remote origin titled "ssh"!');

							logger.info('Making sure our key has the appropriate permissions');
							child_process.execSync("chmod 400 ~/.ssh/id_rsa");

							logger.info('Attempting to pull latest changes from bitbucket repo!');
							child_process.execSync("cd " + process.env.PWD + " && git pull ssh " + name);

						}

						//if we didn't match our payload items for whatever reason, let's send back a 404 
						else {
							res.status(404).send({
								message: 'Did not find the appropriately matching type and name from webhook!',
								type: type,
								name: name
							});
						}
					}

					catch (err) {

						//if we catch an error, we send a 500 to bitbucket
						return res.status(500).send({
							message: 'Something went potentially wrong, please check server logs for receiving webhook!',
							type: type,
							name: name
						});
					}

					//at this point, we've updated environment successfully, so let's log that
					logger.info('Successfully updated environment and restarting our processes!');

					logger.warn('Printing forever services running at this time.');
					child_process.execSync("forever list");

					logger.info('Now stopping any and all forever process.');
					child_process.execSync("forever stopall");

					logger.info('And starting forever process back again, assuming index.js as app entry point.');
					child_process.execSync("forever start index.js");

				break;

				default:
					return res.status(422).send({
						message: 'Bitbucket event ' + req.params.event + ' not registered with system!',
						params: req.params
					});
			}

		});

	return router;

};