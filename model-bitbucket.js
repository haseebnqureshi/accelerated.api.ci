module.exports = function(model, express, app, models, settings) {

	var that = this;
	var log = app.get('log');
	var child = require('child_process');
	var _ = require('underscore');

	this.config = {
		PULL: {},
		RESTART: {},
		INSTALL: {},
		NETWORK: {}
	};

	this.payload = null;
	this.event = null;
	this.actor = null;
	this.shouldPull = false;
	this.shouldRestart = false;
	this.shouldInstall = false;

	var packageJSON = require(process.env.PWD + '/package.json');
	// console.log(packageJSON);


	model = {

		applyConfigToPull: function() {
			_.each(that.config.PULL, function(value, key) {
				model.configToMethod(key, value);
			});
		},

		applyConfigToInstall: function() {
			_.each(that.config.INSTALL, function(value, key) {
				model.configToMethod(key, value);
			});
		},

		applyConfigToRestart: function() {
			_.each(that.config.RESTART, function(value, key) {
				model.configToMethod(key, value);
			});
		},

		config: function() {
			//loads relevant process.env variables into config object
			_.each(process.env, function(value, key) {
				try {
					var match = key.match(/CI\_([a-z]+)\_([a-z0-9\_]+)/i);
					var group = match[1];
					var key = match[2];
					that.config[group][key] = value;
				}
				catch (err) {}
			});
			log.get().debug({ config: that.config });
			return this;
		},

		configToMethod: function(key, value) {
			var method = '';
			switch (key) {
				case 'ACTOR_DISPLAY_NAME':
					method = 'isActorDisplayName';
				break;
				case 'ACTOR_USERNAME':
					method = 'isActorUsername';
				break;
				case 'REPO_FULLNAME': 
					method = 'isEventRepoFullName'; 
				break;
				case 'REPO_NAME':
					method = 'isEventRepoName';
				break;
			}
			return model[method](value);
		},

		isActorDisplayName: function(displayName) { //John Doe
			log.get().debug({ specified: displayName, found: that.actor.display_name });
			return that.actor.display_name == displayName;
		},

		isActorUsername: function(actorUsername) { //johndoe
			log.get().debug({ specified: actorUsername, found: that.actor.username });
			return that.actor.username == actorUsername;
		},

		isEventName: function(eventName) { //master, develop
			log.get().debug({ specified: eventName, found: that.event.name });
			return that.event.name == eventName;
		},

		isEventType: function(eventType) { //branch, tag
			log.get().debug({ specified: eventType, found: that.event.type });
			return that.event.type == eventType;
		},

		isEventRepoFullName: function(repoFullName) { //johndoe/ci-repo
			log.get().debug({ specified: repoFullName, found: that.event.repository.full_name });
			return that.event.repository.full_name == repoFullName;
		},

		isEventRepoName: function(repoName) { //CI Repo
			log.get().debug({ specified: repoName, found: that.event.repository.name });
			return that.event.repository.name == repoName;
		},

		install: function() {

		},

		installIf: function(shouldInstall) {
			log.get().debug({ shouldInstall: shouldInstall });
			that.shouldInstall = shouldInstall;
			return this;
		},

		getActor: function() {
			return that.actor;
		},

		getEvent: function() {
			return that.event;
		},

		pull: function() {

		},

		pullIf: function(shouldPull) {
			log.get().debug({ shouldPull: shouldPull });
			that.shouldPull = shouldPull;
			return this;
		},

		restart: function() {

		},

		restartIf: function(shouldRestart) {
			log.get().debug({ shouldRestart: shouldRestart });
			that.shouldRestart = shouldRestart;
			return this;
		},

		run: function() {
			log.get().warn('Attempting to run...');

			this.applyConfigToPull();
			this.applyConfigToInstall();
			this.applyConfigToRestart();

			log.get().debug({ 
				shouldPull: shouldPull,
				shouldRestart: shouldRestart,
				shouldInstall: shouldInstall 
			});

			if (that.shouldPull) { this.pull(); }
			if (that.shouldInstall) { this.install(); }
			if (that.shouldRestart) { this.restart(); }
		},

		runAfter: function(milliseconds) {
			var milliseconds = milliseconds || 500;
			log.get().warn('Waiting ' + milliseconds + 'ms to run...');
			setTimeout(function() {
				this.run();
			}.bind(this), milliseconds);
		},

		savePayload: function(payload) {
			that.payload = payload;
			return this;
		},

		summarizeActor: function() {
			try {
				that.actor = that.payload.actor;
			}
			catch (err) {
				that.actor = null;
			}
			return this;
		},

		summarizeEvent: function(event) {
			try {
				that.event = that.payload[event || 'push'].changes[0].new;
			}
			catch (err) {
				that.event = null;
			}
			return this;
		}

	};	

	return model;

};