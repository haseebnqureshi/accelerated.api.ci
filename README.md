
## About
This provides a super-easy and basic continuous integration service for Accelerated apps. In particular, this provides clear instructions for GitHub and BitBucket integrations.

## Limited to BitBucket for Right Now
Right now, we're limited to Bitbucket! I've had a number of projects via Bitbucket that I'm getting this module up, and GitHub will quickly be up next! Sorry!

## Limited to Node's Forever
Right now, this requires 

## System
Whenever any changes are made to your repository, and they're pushed to your remote origin, your repo host will fire an event on its custom-defined webhooks. Those webhooks will land at this module, thereby triggering your code to update and respawn.

## Installation
You'll need to generate a private key file and a public key file, and provide them with your project, along with uploading them onto your repsitory host (GitHub or Bitbucket). 
You'll then specify your application's desired webhooks with your repository host.

## Purpose
Continuous integration has its merits, but really shines when you have multiple server instances behind a load balancer. When you make one change to your code, it gets to be _really_ tedious to SSH into each linux box and pull the latest repo changes, and then restart your application. That's where CI really helps take this huge DevOps pain out of your workflow, allowing for quicker and better changes to your code, no matter your application is scaled.

## Usage
There are two ways you can use this code:

### Separate Server (recommended)
Either as a micro-server that runs on your box, in-tandem with your application, but on a different port. You'll register webhooks in either GitHub or Bitbucket, and ```accelerated.api.ci``` will listen on its default port ```4321```, or any other port that you define in ```env.json```.

### With Accelerated App
There might be times when you only want one node process, and that's your Accelerated app on its port, directly pulling information from other parts of your app and data models. If that's the case, simply require this module as you would any other Accelerated module, like this:

```
var api = require('accelerated.api');
var apiCi = require('accelerated.api.ci').use();

api.useRoutes([
	[apiCi.key, apiCi.route]
]);

api.run()
```
