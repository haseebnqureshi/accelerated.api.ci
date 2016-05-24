module.exports = function(model, express, app, models, settings) {

	return {
		bitbucket: require('./model-bitbucket.js')(model, express, app, models, settings)
	}

};