module.exports = function(express, app, models, settings) {

	/*------
	Dependencies
	------------*/

	var model = models[settings.key](express, app, models, settings);

	/*------
	Helpers
	------------*/

	var logger = app.get('logger');

	/*------
	Routes
	------------*/

	var router = express.Router();

	router.route('/')

		//create new resource
		.post(function(req, res) {
			logger.debug('req.body', req.body);
			model.create(req.body, function(rows) {
				logger.debug('rows', rows);
				return res.status(201).send({
					data: rows[0]
				});
			}, function(err) {
				logger.error('err', err);
				return res.status(500).send({
					data: [],
					error: err
				});
			});
		})

		//getting collection of resource
		.get(function(req, res) {
			model.getAll(function(rows) {
				logger.debug('rows', rows);
				return res.status(200).send({
					data: rows
				});
			}, function(err) {
				logger.error(err);
				return res.status(500).send({
					data: [],
					error: err
				});
			});
		});

	router.route('/:resource_id')

		//getting individual resource by id
		.get(function(req, res) {
			logger.debug('req.params', req.params);

			model.get(req.params.resource_id, function(rows) {
				logger.debug('rows', rows);

				//return 404 if no rows were found
				var status = rows.length > 0 ? 200 : 404;
				return res.status(status).send({
					data: rows
				});
			}, function(err) {
				logger.error('err', err);
				return res.status(500).send({
					data: [],
					error: err
				})
			});
		})

		//updating individual resource by id
		.put(function(req, res) {
			logger.debug('req.params', req.params);
			logger.debug('req.body', req.body);

			model.update(req.params.resource_id, req.body, function(rows) {
				logger.debug('rows', rows);
				return res.status(200).send({
					data: rows
				});
			}, function(err) {
				logger.error('err', err);
				return res.status(500).send({
					data: [],
					error: err
				})
			});
		})

		//deleting individual resource by id
		.delete(function(req, res) {
			logger.debug('req.params', req.params);

			model.delete(req.params.resource_id, function() {
				return res.status(200).send({
					data: []
				});
			}, function(err) {
				logger.error('err', err);
				return res.status(500).send({
					data: [],
					error: err
				})
			});
		});

	router.route('/:property/:value')

		.get(function(req, res) {
			logger.debug('req.params', req.params);

			//constructing our where object
			var where = {};
			where[req.params.property] = req.params.value;
			logger.debug('where', where);

			//executing our query
			model.getAllWhere(where, function(rows) {
				logger.debug('rows', rows);

				//return 404 if no rows were found
				var status = rows.length > 0 ? 200 : 404;
				return res.status(status).send({
					data: rows
				});
			}, function(err) {
				logger.error('err', err);
				return res.status(500).send({
					data: [],
					error: err
				})
			});
		})

		.put(function(req, res) {
			logger.debug('req.params', req.params);
			logger.debug('req.body', req.body);

			//constructing our where object
			var where = {};
			where[req.params.property] = req.params.value;
			logger.debug('where', where);

			//executing our query
			model.updateWhere(where, req.body, function(rows) {
				logger.debug('rows', rows);
				return res.status(200).send({
					data: rows
				});
			}, function(err) {
				logger.error('err', err);
				return res.status(500).send({
					data: [],
					error: err
				})
			});
		})

		.delete(function(req, res) {
			logger.debug('req.params', req.params);

			//constructing our where object
			var where = {};
			where[req.params.property] = req.params.value;
			logger.debug('where', where);

			//executing our query
			model.deleteWhere(where, function() {
				return res.status(200).send({
					data: []
				});
			}, function(err) {
				logger.error('err', err);
				return res.status(500).send({
					data: [],
					error: err
				})
			});
		});

	app.use('/' + settings.key, router);

	/*------
	Returning App (ensuring app waterfalls)
	------------*/

	return app;

};