'use strict'
/**********
User Management functions for 
Friend Management Web-services
Version: Prototype Alpha
***********/
var mongoose = require('mongoose');
var async = require("async");
var user = mongoose.model("User");
var ObjectID = require('mongodb').ObjectID;

//Creates a friendship and pushes to MongoDB
exports.addNewFriend = function(req, res, next)
{   
	//Gets all POST information from client side
	var friendInformation = req.params.friends;

	//Generate a correct error msg
	var errorVar = [];

	//Validation request body
	if(req.params === undefined || req.params === ""){
		errorVar.push("You need 2 email addresses.");
	}else if(friendInformation === "" || friendInformation === undefined){
		errorVar.push("You need 2 email addresses.");
	}else if(friendInformation.length != 2){
		errorVar.push("You need 2 email addresses.");
	}
	//Validate Email
	var firstEmail = friendInformation[0];
	var secondEmail = friendInformation[1];

	if(validateEmail(firstEmail)===false || validateEmail(secondEmail)===false){
		errorVar.push("Your email address is/are invalid.");
	}else if(firstEmail == secondEmail){
		errorVar.push("Your email addresses are identical.");
	}
	//Without validation errors, we will process the request
	if(errorVar.length > 0){
		return res.json({
			"errormsg" : errorVar.toString()
		})
	}else{
		var userOne = new user({_id: new ObjectID(), email: firstEmail});
		var userTwo = new user({_id: new ObjectID(), email: secondEmail});
		//Parallet process both users
		async.parallel([
		    function(callback) {
		 		user.findOne({email: firstEmail},function(err, user) {
				  if(err != null){
				  	return res.json({
								"errormsg" : "An error has occured. Please try again!"
							})
				  }
				  //If no user document is found, we will create the user 
				  if(user === null){
				  	
				  	userOne.save(function (err, createdUser) {
					  if(err != null){
					  	return res.json({
								"errormsg" : "An error has occured. Please try again!"
							})
					  }else{
					  	return callback(null,createdUser)
					  }
					});
				  }else{
				  	return callback(null, user)
				  }
				});
		    },
		    function(callback) {
		    	user.findOne({email: secondEmail},function(err, user) {
				  if(err != null){
				  	return res.json({
								"errormsg" : "An error has occured. Please try again!"
							})
				  }
				  //If no user document is found, we will create the user 
				  
				  if(user === null){
				  	
				  	userTwo.save(function (err, createdUser) {
					  if(err != null){
					  	return res.json({
								"errormsg" : "An error has occured. Please try again!"
							})
					  }else{
					  	return callback(null, createdUser)
					  }
					});
				  }else{
				  	return callback(null, user)
				  }
				});
		    }
		], function(err, results) {
			
			var firstUserRelationships = results[0].relationship;
			var secondUserRelationships = results[1].relationship;
			
			//All Possibilities of relationship
			if(firstUserRelationships.length == 0 && secondUserRelationships.length == 0){
				//If it is the first connection for both, we will update both directly
				user.update({email: firstEmail}, { relationship:[{friend_email:secondEmail,friend_status:true,subscriber:false,block:false}]},function(err, raw) {
			    if (err) {
			      return res.json({
								"errormsg" : "An error has occured. Please try again!"
							})
			    }
			    
			  	});
				user.update({email: secondEmail}, { relationship:[{friend_email:firstEmail,friend_status:true,subscriber:false,block:false}]},function(err, raw) {
			    if (err) {
			      return res.json({
								"errormsg" : "An error has occured. Please try again!"
							})
			    }
			    
			  	});

			  	return res.json({
					  "success": true
					});

			//If either one has got friendship, we have to validate the friendship acceptance
			}else if(firstUserRelationships.length >= 0 || secondUserRelationships.length >= 0){

				var indexOfFirstRelationship = null;
				var indexOfSecondRelationship = null;

				async.parallel([
		    	function(callback) {
		    		if(firstUserRelationships.length == 0){
		    			return callback(null,null)
		    		}

		    		for(var i=0;i<firstUserRelationships.length;i++){
		    			var eachRelationship = firstUserRelationships[i];

		    			if(eachRelationship.friend_email == secondEmail){
		    				indexOfFirstRelationship = i;
		    				return callback(null, eachRelationship)
		    			}

		    			if(firstUserRelationships.length-1 == i){
		    				//If no relationship is found
		    				return callback(null,null)
		    			}
		    		}
		    		
		    	},
		    	function(callback) {
		    		if(secondUserRelationships.length == 0){
		    			return callback(null,null)
		    		}

					for(var i=0;i<secondUserRelationships.length;i++){
		    			var eachRelationship = secondUserRelationships[i];

		    			if(eachRelationship.friend_email == firstEmail){
		    				indexOfSecondRelationship = i;
		    				return callback(null, eachRelationship)
		    			}

		    			if(secondUserRelationships.length-1 == i){
		    				//If no relationship is found
		    				return callback(null,null)
		    			}
		    		}

		    	}], function(err, friendshipResults) {

		    		var addFriendValidity = true;
		    		
		    		if(friendshipResults[0] == null && friendshipResults[1] == null){
		    			addFriendValidity = true;
		    		}
		    		//Check whether the person is being blocked 
		    		if(friendshipResults[0] != null){
		    			if(friendshipResults[0].block == true && friendshipResults[0].friend_status == true && addFriendValidity ==true){
		    				addFriendValidity = true;
		    			}else if(friendshipResults[0].block && addFriendValidity ==true){
		    				addFriendValidity = false;
		    			}
		    		}

		    		if(friendshipResults[1] != null){
		    			if(friendshipResults[1].block == true && friendshipResults[1].friend_status == true && addFriendValidity ==true){
		    				addFriendValidity = true;
		    			}else if(friendshipResults[1].block && addFriendValidity ==true){
		    				addFriendValidity = false;
		    			}
		    		}
		    		
		    		//When friend adding is valid
		    		if(addFriendValidity){
		    			
		    			//Different rules on block status and friendship
			    		if(indexOfFirstRelationship != null){
			    			firstUserRelationships.splice(indexOfFirstRelationship, 1)
			    			firstUserRelationships.push({friend_email:secondEmail,friend_status:true,subscriber:friendshipResults[0].subscriber,block:friendshipResults[0].block})
			    				
			    		}else if(indexOfFirstRelationship == null){
			    			firstUserRelationships.push({friend_email:secondEmail,friend_status:true,subscriber:false,block:false});
			    				
			    		}
			    		
						if(indexOfSecondRelationship != null){
		    				secondUserRelationships.splice(indexOfSecondRelationship, 1)
		    				secondUserRelationships.push({friend_email:firstEmail,friend_status:true,subscriber:friendshipResults[1].subscriber,block:friendshipResults[1].block});
		    					
			    		}else{
			    			secondUserRelationships.push({friend_email:firstEmail,friend_status:true,subscriber:false,block:false});
			    		}
			    			
						//Update their relationship accordingly
			    		user.update({email: firstEmail}, { relationship:firstUserRelationships},function(err, userOneUpdate) {
							    if (err) {
							      return res.json({
												"errormsg" : "An error has occured. Please try again!"
											})
							    }
						});

						user.update({email: secondEmail}, { relationship:secondUserRelationships},function(err, userTwoUpdate) {
							    if (err) {
							      return res.json({
												"errormsg" : "An error has occured. Please try again!"
											})
							    }
						});
							
						//Returns success msg
						return res.json({
								"success": true
							});
						

					//When friend adding is invalid
					}else{
						return res.json({
							"success": false
						});
					}
		    	});
			}
		});
	}
	next();
};

//Retrieve Friends list of a particular email 
exports.listAllFriends = function(req, res, next)
{
	//Gets all POST information from client side
	var email = req.params.email;
	//Generate a correct error msg
	var errorVar = [];

	//Validation request body
	if(req.params === undefined || req.params === ""){
		errorVar.push("You need an email address.");
	}else if(email === "" || email === undefined){
		errorVar.push("You need an email address.");
	}

	if(validateEmail(email)===false){
		errorVar.push("Your email address is invalid.");
	}

	//Without validation errors, we will process the listing request
	if(errorVar.length > 0){
		return res.json({
			"errormsg" : errorVar.toString()
		})

	}else{
		//Find user and retrieve the friend list
		user.findOne({email: email},function(err, user) {
			if(err != null){
				return res.json({
								"errormsg" : "An error has occured. Please try again!"
						})
			}
				  
			if(user === null){
				return res.json({
								"errormsg" : "There is no such user!"
						})  	
				  	
			}else{
				var allUserRelationships = user.relationship;

				if(allUserRelationships.length == 0){
					return res.send({
					  "success": true,
					  "friends" : [],
					  "count" : 0   
					});
				}else{
					//Variables to store friends' email and friends count
					var allFriends = [];
					var count = 0;

					for(var i =0;i<allUserRelationships.length;i++){
						var eachRelationship = allUserRelationships[i];

						if(eachRelationship.friend_status == true){
							allFriends.push(eachRelationship.friend_email);
							count++
						}

						if(allUserRelationships.length-1 == i){
							return res.send({
							  "success": true,
							  "friends" :allFriends,
							  "count" : count   
							});
						}
					}
				}
			}
		});
	}
	next();
};

//Find mutual friends between 2 users.
exports.findMutualFriends = function(req, res, next)
{   
	//Gets all POST information from client side
	var friendInformation = req.params.friends;

	//Generate a correct error msg
	var errorVar = [];

	//Validation request body
	if(req.params === undefined || req.params === ""){
		errorVar.push("You need 2 email addresses.");
	}else if(friendInformation === "" || friendInformation === undefined){
		errorVar.push("You need 2 email addresses.");
	}else if(friendInformation.length != 2){
		errorVar.push("You need 2 email addresses.");
	}
	//Validate Email
	var firstEmail = friendInformation[0];
	var secondEmail = friendInformation[1];

	if(validateEmail(firstEmail)===false || validateEmail(secondEmail)===false){
		errorVar.push("Your email address is/are invalid.");
	}else if(firstEmail == secondEmail){
		errorVar.push("Your email addresses are identical.");
	}
	//Without validation errors, we will process the request
	if(errorVar.length > 0){
		return res.json({
			"errormsg" : errorVar.toString()
		})
	}else{
		//Find all mutual friends
		async.parallel([
		function(callback) {
			user.findOne({email: firstEmail},function(err, user) {
				if(err != null){
					return res.json({
									"errormsg" : "An error has occured. Please try again!"
							})
				}
					  
				if(user === null){
					return callback(null,null);		
				}else{
					return callback(null,user);
				}
			});
		},
		function(callback) {
			user.findOne({email: secondEmail},function(err, user) {
				if(err != null){
					return res.json({
									"errormsg" : "An error has occured. Please try again!"
							})
				}
					  
				if(user === null){
					return callback(null,null);		
				}else{
					return callback(null,user);
				}
			});
		}], function(err, results) {
			
			//Check if both user existed in mongodb
			if(results[0] == null && results[1] == null){
					return res.json({
									"errormsg" : "Both of your users do not exist!"
							})				
			}else if(results[0] == null){
					return res.json({
									"errormsg" : firstEmail+" does not exist!"
							})
			}else if(results[1] == null){
					return res.json({
									"errormsg" : secondEmail+" does not exist!"
							})
			//There is no friend on either side
			}else if(results[0].relationship.length == 0 || results[1].relationship.length == 0 ){
					return res.send({
					  "success": true,
					  "friends" :
					    [],
					  "count" : 0   
					});
			}

			var listOfFriends = [];
			
			//Generate a list of friend from first user as template for matching
			for(var i =0;i<results[0].relationship.length;i++){
				var eachRelationship = results[0].relationship[i];

				if(eachRelationship.friend_status == true){
					listOfFriends.push(eachRelationship.friend_email);
				}
				//Settle the matching with a smaller list
				if(results[0].relationship.length-1 == i){
					var mutualFriends = [];
					
					for(var x=0;x<listOfFriends.length;x++){
						var firstUserFriendship = listOfFriends[x];

						for(var q=0;q<results[1].relationship.length;q++){
							var secondUserRelationship = results[1].relationship[q];

							if(secondUserRelationship.friend_email==firstUserFriendship && secondUserRelationship.friend_status==true){
								mutualFriends.push(secondUserRelationship.friend_email);
								break;
							}
						}

						if(listOfFriends.length-1 == x){
							return res.send({
							  "success": true,
							  "friends" :mutualFriends,
							  "count" : mutualFriends.length   
							});							
						}
					}
				}
			}
		});
	}
	next();
};

//Subscribe to updates of a person(Can be Friend or Stranger -> Target must exist in our DB)
exports.subscribeUpdates = function(req, res, next)
{ 
	//Gets all POST information from client side
	var requestorEmail = req.params.requestor;
	var targetEmail = req.params.target;

	//Generate a correct error msg
	var errorVar = [];

	//Validation request body
	if(req.params === undefined || req.params === ""){
		errorVar.push("You need a requestor and target.");
	}else if(requestorEmail === "" || requestorEmail === undefined || validateEmail(requestorEmail)==false){
		errorVar.push("You need a requestor email.");
	}else if(targetEmail === "" || targetEmail === undefined || validateEmail(targetEmail)==false){
		errorVar.push("You need a target email.");
	}

	//Without validation errors, we will process the request
	if(errorVar.length > 0){
		return res.json({
			"errormsg" : errorVar.toString()
		})
	}else{
		var requestorObj = new user({_id: new ObjectID(), email: requestorEmail});

		async.parallel([
		function(callback) {
			user.findOne({email: requestorEmail},function(err, user) {
				if(err != null){
					return res.json({
									"errormsg" : "An error has occured. Please try again!"
							})
				}
				//If requestor does not exist, we will create it	  
				if(user === null){
					requestorObj.save(function (err, createdUser) {
					  if(err != null){
					  	return res.json({
								"errormsg" : "An error has occured. Please try again!"
							})
					  }else{
					  	return callback(null, createdUser)
					  }
					});	
				}else{
					return callback(null,user);
				}
			});
		},
		function(callback) {
			user.findOne({email: targetEmail},function(err, user) {
				if(err != null){
					return res.json({
									"errormsg" : "An error has occured. Please try again!"
							})
				}
					  
				if(user === null){
					return callback(null,null);		
				}else{
					return callback(null,user);
				}
			});
		}], function(err, results) {
			
			if(results[0] == null && results[1] == null){
					return res.json({
									"errormsg" : "An error had occurred!Please try again!"
							})				
			}else if(results[0] == null){
					return res.json({
									"errormsg" : "Requestor does not exist!"
							})
			}else if(results[1] == null){
					return res.json({
									"errormsg" : "Target does not exist!"
							})
			}else{
				if(results[0].relationship.length == 0){
					//If it is the first relationship for subscriber, we will add directly
					user.update({email: requestorEmail}, { relationship:[{friend_email:targetEmail,friend_status:false,subscriber:true,block:false}]},function(err, raw) {
					    if (err) {
					        return res.json({
										"errormsg" : "An error has occured. Please try again!"
									})
					    }else{
					    	return res.json({
										"success": true
									});
					    }
					});
				}else{
					var indexOfTargetEmail = null;
					var relationshipObj = null

					for(var i=0;i<results[0].relationship.length;i++){
						var eachRelationship = results[0].relationship[i];
						//Found the particular relationship
						if(eachRelationship.friend_email === targetEmail){
							relationshipObj = eachRelationship;
							indexOfTargetEmail = i;
							break;
						}
						//Nothing is found, we will add new relationship
						if(results[0].relationship.length-1 == i && relationshipObj == null){

							results[0].relationship.push({friend_email:targetEmail,friend_status:false,subscriber:true,block:false});
							
							//If it is the first relationship for subscriber, we will add directly
							user.update({email: requestorEmail}, { relationship: results[0].relationship},function(err, raw) {
							    if (err) {
							        return res.json({
												"errormsg" : "An error has occured. Please try again!"
											})
							    }
							});
							return res.json({
												"success": true
											});
						}
					}

					if(relationshipObj != null){
							//If the relationship object is found, we will remove and update it to our mongodb
							if(indexOfTargetEmail != null){
								results[0].relationship.splice(indexOfTargetEmail, 1);
							}
							
							//Update the relationship array
				    		results[0].relationship.push({friend_email:targetEmail,friend_status:relationshipObj.friend_status,subscriber:true,block:relationshipObj.block});
							
							user.update({email: requestorEmail}, { relationship: results[0].relationship },function(err, raw) {
								
								    if (err) {
								      return res.json({
													"errormsg" : "An error has occured. Please try again!"
												})
								    }
							    
							});

							//Returns success msg
							return res.json({
									"success": true
							});

					}
				}
			}
		});
	}
	next();
};

//Block the person from receiving updates(Both persons must exist in our DB)
exports.blockReceivingUpdates = function(req, res, next)
{
	//Gets all POST information from client side
	var requestorEmail = req.params.requestor;
	var targetEmail = req.params.target;

	//Generate a correct error msg
	var errorVar = [];

	//Validation request body
	if(req.params === undefined || req.params === ""){
		errorVar.push("You need a requestor and target.");
	}else if(requestorEmail === "" || requestorEmail === undefined || validateEmail(requestorEmail)==false){
		errorVar.push("You need a requestor email.");
	}else if(targetEmail === "" || targetEmail === undefined || validateEmail(targetEmail)==false){
		errorVar.push("You need a target email.");
	}

	//Without validation errors, we will process the request
	if(errorVar.length > 0){
		return res.json({
			"errormsg" : errorVar.toString()
		})
	}else{
		async.parallel([
		function(callback) {
			user.findOne({email: requestorEmail},function(err, user) {
				if(err != null){
					return res.json({
									"errormsg" : "An error has occured. Please try again!"
							})
				}
				//If requestor does not exist, we will create it	  
				if(user === null){
					return callback(null,null);		
				}else{
					return callback(null,user);
				}
			});
		},
		function(callback) {
			user.findOne({email: targetEmail},function(err, user) {
				if(err != null){
					return res.json({
									"errormsg" : "An error has occured. Please try again!"
							})
				}
					  
				if(user === null){
					return callback(null,null);		
				}else{
					return callback(null,user);
				}
			});
		}], function(err, results) {
				if(results[0].relationship.length == 0){
					//If it is the first relationship for subscriber, we will add directly
					user.update({email: requestorEmail}, { relationship:[{friend_email:targetEmail,friend_status:false,subscriber:false,block:true}]},function(err, raw) {
					    if (err) {
					        return res.json({
										"errormsg" : "An error has occured. Please try again!"
									})
					    }else{
					    	return res.json({
										"success": true
									});
					    }
					});
				}else{
					var indexOfTargetEmail = null;
					var relationshipObj = null

					for(var i=0;i<results[0].relationship.length;i++){
						var eachRelationship = results[0].relationship[i];
						//Found the particular relationship
						if(eachRelationship.friend_email === targetEmail){
							relationshipObj = eachRelationship;
							indexOfTargetEmail = i;
							break;
						}
						//Nothing is found, we will add new relationship
						if(results[0].relationship.length-1 == i && relationshipObj == null){

							results[0].relationship.push({friend_email:targetEmail,friend_status:false,subscriber:false,block:true});
							
							//If it is the first relationship for subscriber, we will add directly
							user.update({email: requestorEmail}, { relationship: results[0].relationship},function(err, raw) {
							    if (err) {
							        return res.json({
												"errormsg" : "An error has occured. Please try again!"
											})
							    }
							});
							return res.json({
												"success": true
											});
						}
					}

					if(relationshipObj != null){
							//If the relationship object is found, we will remove and update it to our mongodb
							if(indexOfTargetEmail != null){
								results[0].relationship.splice(indexOfTargetEmail, 1);
							}
							
							//Update the relationship array
				    		results[0].relationship.push({friend_email:targetEmail,friend_status:relationshipObj.friend_status,subscriber:relationshipObj.subscriber,block:true});
							
							user.update({email: requestorEmail}, { relationship: results[0].relationship },function(err, raw) {
								
								    if (err) {
								      return res.json({
													"errormsg" : "An error has occured. Please try again!"
												})
								    }
							    
							});

							//Returns success msg
							return res.json({
									"success": true
							});

					}
				}

		});		
	}
	next();	
}; 

//Generates a receiver list for a sender's feed
exports.feedReceiverList = function(req, res, next)
{	
	//Gets all POST information from client side
	var senderEmail = req.params.sender;
	var text = req.params.text;
	
	//Generate a correct error msg
	var errorVar = [];

	//Validation request body
	if(req.params === undefined || req.params === ""){
		errorVar.push("You need a sender email and text.");
	}else if(senderEmail === "" || senderEmail === undefined || validateEmail(senderEmail)==false){
		errorVar.push("You need a sender email.");
	}else if(text ==undefined){
		//Text can be empty but not undefined
		errorVar.push("You need a text message.");
	}

	//Without validation errors, we will process the request
	if(errorVar.length > 0){
		return res.json({
			"errormsg" : errorVar.toString()
		})
	}else{

		var mentionedEmailsArr = extractAllEmails(text);
		//Parallelism of Mongo Calls - Make of the non io-blocking nature of V8 
		async.parallel([
		function(callback) {
			//Querying for friends and subscribers who never block
			user.find({ 
	            "relationship": {
	                "$elemMatch": {
	                    'friend_email':senderEmail,
	                    "$or": [{'friend_status':true},{'subscriber':true}],
	                    'block':false
	                }
	            }
	        }, function (err, friendReceiverList) {
	        	
	        	if(err != null){
					return res.json({
									"errormsg" : "An error has occured. Please try again!"
							})
				}

				return callback(null,friendReceiverList);
				
		    });

		},
		function(callback) {
			//Check if there are any email(s) mentioned
			if(mentionedEmailsArr==null){
				//Returns Nothing
				return callback(null,[]);
			}else{
				var allMentionedUserObj = [];

				async.every(mentionedEmailsArr, function(eachEmail, callback) {
					
					var query = {"email":eachEmail},
				    update = {},
				    options = { upsert: true, new: true, setDefaultsOnInsert: true };

					//Find all mentioned name. If not found, we create
					user.findOneAndUpdate(query, update, options, function (err, mentionedUser) {
			 			
						if(err != null){
							return res.json({
											"errormsg" : "An error has occured. Please try again!"
									})
						}
						
						allMentionedUserObj.push(mentionedUser);
						callback(null,allMentionedUserObj);
						
						
				    });
				}, function(err,list) {
					
				 	if(err != null){
						return res.json({
									"errormsg" : "An error has occured. Please try again!"
								})
					}else{
						return callback(null,allMentionedUserObj);
					}

				});
			}
		}], function(err, userList) {
			//Sieves out all the correct receivers (emails)
			async.parallel([
			function(callback) {
				/*This list is confirmed receivers*/
				if(userList[0].length == 0){
					return callback(null,[]);
				}else{
					var allUsers = [];
					for(var i=0;i<userList[0].length;i++){
						allUsers.push(userList[0][i].email);

						if(userList[0].length-1 == i){
							
							return callback(null,allUsers);
						}
					}
				}
			},
			function(callback) {
				/*This list is not necessary so.*/
				if(userList[1].length == 0){
					return callback(null,[]);
				}else{
					//There were possibilities of users blocking sender
					var verifiedReceivers =[];

					for(var i=0;i<userList[1].length;i++){
						var eachUser = userList[1][i];
						//Check if the relationship allows for receiving updates
						
						if(eachUser.relationship.length == 0){
							verifiedReceivers.push(eachUser.email);
							
							if(i == userList[1].length){
								
								return callback(null,verifiedReceivers);
								
							}
						}else if(eachUser.relationship.length > 0){
							var qcount = 0;
							for(var q=0;q<eachUser.relationship.length;q++){
								var eachRelationship = eachUser.relationship;

								if(eachRelationship.friend_email==senderEmail && eachRelationship.block==false){
									qcount++;
									verifiedReceivers.push(eachUser.email);
									break;
								}
								if(eachUser.relationship.length-1==q && qcount==0){
									verifiedReceivers.push(eachUser.email);

								}

							}
						}
						if(i == userList[1].length-1){
								
							return callback(null,verifiedReceivers);
								
						}
					}
				}
				
			}], function(err, emailList) {
				
				//Returns the result
				return res.send({
					  "success": true,
					  "recipients": emailList[0].concat(emailList[1]).unique(senderEmail)	
				});
			});
		});
	}
	next();
};

//Validate Email
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

//Extract all mentioned emails
function extractAllEmails (feed)
{
    return feed.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
}

//Based on Stackoverflow resource -> (Modified Unique function into our use case)
//https://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript-and-de-duplicate-items 
Array.prototype.unique = function(senderEmail) {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
        if(senderEmail==a[i]){
        	a.splice(i, 1);
        }
    }

    return a;
};


