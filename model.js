module.exports = function(model, express, app, models, settings) {

	return {
		bitbucket: new require('./model-bitbucket.js')(model, express, app, models, settings)
	}

};