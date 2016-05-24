module.exports = function(model, express, app, models, settings) {

	var that = this;
	var log = app.get('log');
	var child = require('child_process');
	var _ = require('underscore');

	//this will help us knowing what entry file triggers our node application
	this.packageJSON = require(process.env.PWD + '/package.json');

	this.config = {
		GIT: {},
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

		ensureSetup: function() {

			/*
			There are so many moving pieces to continuous integration, 
			that we have this method to ensure all the missing pieces
			are there. This checks for nearly everything except for 
			the repo hosting's webhook creation.
			*/

			try {

				//create our long bash command
				var cmd = [
					'bash',
					__dirname + '/ensure.sh',
					process.env.PWD,
					that.config.GIT.SSH_URL,
					that.config.GIT.SSH_PRIVATE_KEY_PATH,
					that.config.GIT.SSH_PUBLIC_KEY_PATH
				].join(' ');

				//make sure we run with root privileges
				child.execSync(cmd, [], {
					uid: 'root'
				});
			}
			catch (err) {
				log.get().error('Setup failed! See below...');
				log.get().error(err);
			}

			return this;
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
			
			/*
			This installs all NPM depdencies in the application's 
			package.json. This might be	too invasive and widespread, but 
			it's what we're rolling with right now. We can always extend 
			and customize this feature over	time.
			*/

			log.get().info('Attempting to install application via NPM...');

			try {

				var cmd = [
					'bash',
					__dirname + '/install.sh',
					process.env.PWD
				].join(' ');

				//make sure we run with root privileges
				child.execSync(cmd);
			}
			catch (err) {
				log.get().error('Install failed! See above...');
			}
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

		loadEnvVars: function() {
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

		pull: function() {

			/*
			By default, this pulls the latest changes from the particular
			branch that we've found in our payload's event. So if there's
			a massive push on both master and develop branches, BitBucket
			should send 2 payloads, each with different branch names.
			*/

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
			
			/*
			Just in case if a server goes down and there's nothing to restart,
			we define "restart" as "stop" and "start" methods. 

			We are NOT going to run this with root privileges. For all the 
			newer developers wanting to run a node application using root
			permissions, too bad. Find another way, preferably using iptables
			to reroute towards a safe port (80 -> 8080).
			*/

			log.get().info('Attempting to restart application via forever...');
			
			try {

				var cmd = [
					'bash',
					__dirname + '/restart.sh',
					process.env.PWD + '/' + that.packageJSON.main
				].join(' ');

				//make sure we run with root privileges
				child.execSync(cmd);
			}
			catch (err) {
				log.get().error('Restart failed! See above...');
			}
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