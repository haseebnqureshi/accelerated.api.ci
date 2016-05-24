module.exports = function(model, express, app, models, settings) {

	var that = this;
	var log = app.get('log');
	var child = require('child_process');
	var _ = require('underscore');

	this.config = {
		PULL: {},
		RESTART: {},
		INSTALL: {},
		NETWORK: {},
		RUN: {}
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

		applyConfig: function() {
			_.each(['PULL', 'INSTALL', 'RESTART'], function(group) {

				/*
				Go through all conditional values for each group. If all
				values match, that is their unique array has a length of
				1, then we directly set our shouldKey to its unanimous 
				value. Otherwise, we leave our key alone.
				*/

				var shouldKey = 'should' + group.substr(0,1) + group.substr(1).toLowerCase();
				var shouldValues = [];
				_.each(that.config[group], function(value, key) {
					shouldValues.push(model.configToMethod(key, value));
				});
				if (_.uniq(shouldValues).length == 1) {
					that[shouldKey] = shouldValues[0];
				}
			});
			log.get().debug({ 
				shouldPull: that.shouldPull,
				shouldRestart: that.shouldRestart,
				shouldInstall: that.shouldInstall 
			});
			return this;
		},

		callActions: function() {
			if (that.shouldPull) { this.pull(); }
			if (that.shouldInstall) { this.install(); }
			if (that.shouldRestart) { this.restart(); }
		},

		config: function() {
			//loads relevant process.env variables into config object
			_.each(process.env, function(value, key) {
				try {
					var match = key.match(/CI\_([a-z]+)\_([a-z0-9\_]+)/i);
					var group = match[1];
					var key = match[2];
					//ensuring data types come through after parsed vars
					if (parseFloat(value)) { value = parseFloat(value); }
					else if (value.toLowerCase() == 'true') { value = true; }
					else if (value.toLowerCase() == 'false') { value = false; }
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

		getDelay: function() {
			var milliseconds = that.config.RUN.DELAY || 500;
			if (that.config.RUN.DELAY_RANDOMIZED === true) {
				var max = that.config.RUN.DELAY_MAX || 5000;
				milliseconds = Math.round( Math.random() * (max - milliseconds) ) + milliseconds;
			}
			return milliseconds;
		},

		getEvent: function() {
			return that.event;
		},

		getEventName: function() {
			return that.event.name;
		},

		pull: function() {
			log.get().info('Attempting to pull ' + this.getEventName() + ' from remote origin...');
			try {
				child.execSync('cd ' + process.env.PWD + ' && git pull ssh ' + this.getEventName());
			}
			catch (err) {
				log.get().error('Pull failed! See above...');
			}
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
			var milliseconds = this.getDelay();
			log.get().warn('Waiting ' + milliseconds + ' ms to run...');
			setTimeout(function() {
				log.get().warn('Attempting to run...');
				this.applyConfig();
				this.callActions();
			}.bind(this), milliseconds);
			return this;
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