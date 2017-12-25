var mongoose = require('mongoose');
/*
Relationship attribute in this scenario is
like vertices toward different nodes 

Each vertice has keys for friend_status, follower_status, block_status
*/
module.exports = mongoose.model('User', {
    email: {
        type: String
    },
    relationship: [{friend_email: String,friend_status: Boolean, subscriber: Boolean, block: Boolean}]
});