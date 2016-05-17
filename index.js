module.exports = (function() {

    //loading accelerated's module with your appropriate settings
    var module = new require('accelerated.api.module')({

        //set your module's key for reference by middlwares, models, and routes 
        key: 'ci',

        //set your module's name for logging output 
        name: 'CI Module',

        //you can choose to extend your module's routes
        appendRoute: require('./route.js')

    });

    //returning for use by accelerated.api
    return module;

})();