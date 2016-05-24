
## About
This provides a super-easy and basic continuous integration service for Accelerated apps. In particular, this provides clear instructions for GitHub and BitBucket integrations.

## First BitBucket, GitHub Coming Next
Right now this module is only for Bitbucket. I've had a number of projects via Bitbucket that I'm getting this module up, but GitHub will quickly be up next.

## Limited to Node's Forever
Right now, this uses the NPM package forever to start and stop your application service.

## System
Whenever any changes are made to your repository, and they're pushed to your remote origin, your repo host will fire an event on its custom-defined webhooks. Those webhooks will land at this module, thereby triggering your code to update and respawn.

## Installation
You'll need to generate a private key file and a public key file, and provide them with your project, along with uploading them onto your repsitory host (GitHub or Bitbucket). Besides that, incorporate some of the variables as you see fit into you ```env.json```. More detailed explanations will be coming soon:

```
{
	"ENV_DEFAULT": {	
		"EXPRESS_PORT": 8080,
		"CI_GIT_SSH_URL": "git@bitbucket.org:johndoe/test.git",
		"CI_GIT_SSH_PRIVATE_KEY_PATH": "key",
		"CI_GIT_SSH_PUBLIC_KEY_PATH": "key.pub",
		"CI_RUN_DELAY": 500,
		"CI_RUN_DELAY_RANDOMIZED": false,
		"CI_RUN_DELAY_MAX": 5000,
		"CI_PULL_REPO_FULLNAME": "johndoe/example",
		"CI_INSTALL_ACTOR_USERNAME": "johndoe",
		"CI_RESTART_ACTOR_USERNAME": "johndoe",
		"CI_NETWORK_URL1": "",
		"CI_NETWORK_URL2": "",
		"CI_NETWORK_URL3": ""
	},
	"ENV_OVERRIDE": "LOCAL",
	"ENV_OVERRIDES": {
		"LIVE": {},
		"TEST": {},
		"LOCAL": {
			"EXPRESS_PORT": 8080
		}
	}
}
```

## Purpose
Continuous integration has its merits, but really shines when you have multiple server instances behind a load balancer. When you make one change to your code, it gets to be _really_ tedious to SSH into each linux box and pull the latest repo changes, and then restart your application. That's where CI really helps take this huge DevOps pain out of your workflow, allowing for quicker and better changes to your code, no matter your application is scaled.

## Usage
Simply require this module as you would any other Accelerated module, like this:

```
var api = require('accelerated.api');
var apiCi = require('accelerated.api.ci').use();

api.useModels([
	[apiCi.key, apiCi.model]
]);

api.useRoutes([
	[apiCi.key, apiCi.route]
]);

api.run()
```
