//Requires
const WebSocket = require('ws');
const uuidv1 = require('uuid/v1');
const redis = require('redis');

//Variables
const wss = new WebSocket.Server({port:8181});
const redisClient = redis.createClient();
let connections = [];
let connectionsByPlayerId = {};
const ACTION_KEY = '_ACTION';
const ROOM_KEY = '_ROOM';
const SECONDS_IN_DAY = 86400;

//Functions
function generatePlayerId()
{
    return uuidv1();
}

function notifyOtherPlayers(type, messageBody)
{
    connections.forEach(element => {
        const message = {
            type:type,
            message: messageBody
        }
        element.send(JSON.stringify(message));
    });
}

function notifyOtherPlayersInTheRoom(type, messageBody, room)
{
    otherPlayers = redisClient.SMEMBERS(room);
}

function updatePlayerAction(playerId, action)
{
    redisClient.SETEX(playerId+ACTION_KEY, SECONDS_IN_DAY, action);
    notifyOtherPlayers('notification','Player: '+playerId+ ' has updated his action to ' + action)
}

function updatePlayerRoom(playerId, room)
{
    redisClient.SADD(room, playerId);
}

//Initialize
wss.on('connection', ws => {
    ws.on('message', message => {
        console.log(`Received message => ${message}`)
        try {
            const messageObject = JSON.parse(message);
            switch(messageObject.type)
            {
                case 'handshake':
                    const playerId = generatePlayerId();
                    connectionsByPlayerId[playerId] = ws;
                    const response = {
                        type: 'handshake',
                        playerId: playerId
                    }
                    notifyOtherPlayers('notification', 'New Player ' + playerId + ' joined');
                    ws.send(JSON.stringify(response));
                    break;
                case 'actionChange':
                    updatePlayerAction(messageObject.playerId, messageObject.action);
                    break;
                case 'roomChange':
                    updatePlayerRoom(messageObject.playerId, messageObject.room);
                    break;
                default:
                    console.log('Unknown message type', messageObject.type)
                    break;
            }
            
        } catch (e) {
            if(e instanceof SyntaxError) {
                console.log('Failed to parse message', e.message);
            }
        }
        
    });

    ws.on('close', function(code, reason) {
        console.log("Connection closed with code: "+code+" and because "+reason);
    });
    connections.push(ws);
});