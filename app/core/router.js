'use strict'
/********************************
 A Router for Friends Management
 REST web-services
 Version: Prototype Alpha
********************************/
var restify = require('restify'),
	  fs = require('fs'),
    cluster = require('cluster'),
    morgan = require('morgan'),
    rfs    = require('rotating-file-stream'),
    swagger = require('swagger-restify')

 
/* Connects to all space controllers */
var controllers = {}
    , controllers_path = process.cwd() + '/app/controllers'
fs.readdirSync(controllers_path).forEach(function (file) {
    if (file.indexOf('.js') != -1) {
        controllers[file.split('.')[0]] = require(controllers_path + '/' + file)
    }
})

/********************************
This function is handler for methods
*********************************/
function unknownMethodHandler(req, res) {
  if (req.method.toLowerCase() === 'options') {
    var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'Origin', 'X-Requested-With']; // added Origin & X-Requested-With

    if (res.methods.indexOf('OPTIONS') === -1) res.methods.push('OPTIONS');

    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
    res.header('Access-Control-Allow-Methods', res.methods.join(', '));
    res.header('Access-Control-Allow-Origin', req.headers.origin);

    return res.send(204);
  }
  else{
    return res.send(new restify.MethodNotAllowedError());
  }
}
//For 403 Error
function forbiddenSpace(req, res, err, cb){
    res.json({ "error" : "This space is forbidden!"})
}

/* Creating cluster to optimized uptime! */
var server;

if (cluster.isMaster) 
{
  console.log('Friends Management Server is all Green. Forking friendship workers now.');   
  var cpuCount = require('os').cpus().length;
  for (var i=0; i<cpuCount; i++) 
  {
    cluster.fork();
  }
  cluster.on('exit', function(worker) 
  {
    console.error('Friendship Worker %s has died! Creating a new friendship worker.', worker.id);
    cluster.fork();
  });
} 
else{

	/*Creates a server!*/
	server = restify.createServer();

	//Before routing, plugins to function
	server.pre(restify.pre.sanitizePath())
	.use(restify.plugins.fullResponse())
	.use(restify.plugins.acceptParser(server.acceptable))
	.use(restify.plugins.authorizationParser())
	.use(restify.plugins.dateParser())
	.use(restify.plugins.queryParser())
	.use(restify.plugins.jsonp())
	.use(restify.plugins.gzipResponse())
	.use(restify.plugins.bodyParser({ mapParams: true }))
	.use(morgan('common', {
	  stream: fs.createWriteStream(process.cwd()+'/logs/access.log', {flags: 'a'})
	}))
	.on('MethodNotAllowed', unknownMethodHandler)
	.on('Forbidden',forbiddenSpace)
  .on('NotFound',forbiddenSpace)
	.on('InternalServer', function (req, res, err, cb) {
    res.json({ "error" : "Boom! Please try again!"})
  })
  .on('restifyError', function (req, res, err, cb) {
    res.json({ "error" : "Boom! Please try again!"})
  });

//Init Swagger for documentation and testing purposes.
 swagger.init(server, {
      swagger: '2.0', // or swaggerVersion as backward compatible
      info: {
          version: '1.0',
          title: 'Friend Management'
      },
      tags: [],
      host: 'localhost:8080',
      apis: ['api.yml'],
      produces: [
          'application/json'
      ],
      consumes: [
          'application/json'
      ],
  
      // swagger-restify proprietary
      swaggerURL: '/swagger',
      swaggerUI: './public'
  })
  
 
  /*******
  Friendship Management Web Services
  *******/
  //Creates new friendship (If users do not exist, we will add them into mongodb) -User Stories 1
  server.post(/^\/addFriend/, controllers.users_controller.addNewFriend)
  //List all friends of an email -User Stories 2
  server.post(/^\/listAllFriends/, controllers.users_controller.listAllFriends)
  //Find mutual friends between 2 friends   -User Stories 3
  server.post(/^\/findMutualFriends/, controllers.users_controller.findMutualFriends)
  //Subscribe to updates from target email  (If requestor does not exist, we will add them into mongodb) -User Stories 4
  server.post(/^\/subscribeUpdates/, controllers.users_controller.subscribeUpdates)
  //Blocks updates from target email -User Stories 5
  server.post(/^\/blockReceivingUpdates/, controllers.users_controller.blockReceivingUpdates)
  //Generates a list of receivers for a feed (update) If mentioned user does not exist, we will create a new user -User Stories 6
  server.post(/^\/feedReceiverList/, controllers.users_controller.feedReceiverList)  


  //Listeners for worker(s) on port
  server.listen(8080, function() 
  {
    console.log('Friendship Worker %s spawned for port %s.', cluster.worker.id, 8080);
  }); 

}

