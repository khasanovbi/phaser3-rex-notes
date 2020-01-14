import FirebasePlugin from '../../plugins/firebase-plugin.js';
import firebaseConfig from './firebaseConfig.js';

import GetRandomWord from '../../plugins/utils/string/GetRandomWord.js';
import Delay from '../../plugins/utils/promise/Delay.js';
import Clone from '../../plugins/utils/object/Clone.js';

class Demo extends Phaser.Scene {
    constructor() {
        super({
            key: 'examples'
        })
    }

    preload() {
        this.plugins.get('rexFire').preload(this);
    }

    create() {
        this.plugins.get('rexFire').initializeApp(firebaseConfig);

        var self = this;
        CreateRandomRoom.call(self)
            .then(function (roomConfig) {
                return Delay(1000, roomConfig)
            })
            .then(function (roomConfig) {
                return JoinRoom.call(self, roomConfig.roomID)
            })
    }

    update() { }
}

var CreateRoomInstance = function () {
    var rexFire = this.plugins.get('rexFire');
    var room = rexFire.add.room({
        root: 'test-room',
        itemTable: {
            type: '1d',
            eventNames: {
                addkey0: 'table.update',
                removekey0: 'table.update',
                changekey0: 'table.update'
            }
        }
    })
        .setUser(GetRandomWord(5), '')

    room
        .on('userlist.join', function (userInfo) {
            console.log(`${room.userID}: User ${userInfo.userID} join room ${room.roomID}`, Clone(room.getUserList()))
        })
        .on('userlist.leave', function (userInfo) {
            console.log(`${room.userID}: User ${userInfo.userID} leave room ${room.roomID}`)
        })
        .on('broadcast.receive', function (message) {
            console.log(`${room.userID}: Receive message '${message.message}' sent from ${message.senderID}`)
        })
        .on('table.update', function () {
            console.log(`${room.userID}: Table content:`, room.itemTable.getData())
        })
    return room;
}

var CreateRandomRoom = function () {
    // Simulate an user creates a random room
    var room = CreateRoomInstance.call(this)
    var userID = room.userID;

    room
        .on('userlist.join', function (userInfo) {
            // Send welcom message later, user might not be initialized yet now
            setTimeout(function () {
                room.broadcast.send(`Hello ${userInfo.userID}`)
            }, 300)
        })
    return room
        .createRandomRoom({
            digits: 6,
            candidates: '0123456789',
            maxUsers: 2,

            filterData: { a: 10, b: 20 }
        })
        .then(function (roomConfig) {
            console.log(`${userID}: Create room ${roomConfig.roomID}`)
            // room.changeRoomName('aaabbb')
            // room.changeFilterData({ a: 30, b: 40 })
            room.itemTable.setData('a', 10);
            return Promise.resolve(roomConfig)
        });
}

var JoinRoom = function (roomID) {
    // Simulate an user joins a room via roomId
    var room = CreateRoomInstance.call(this)
    var userID = room.userInfo.userID;

    // Leave room after 1000ms
    setTimeout(function () {
        var prevRoomID = room.roomID;
        room
            .leaveRoom()
            .then(function () {
                return room.getUserList(prevRoomID)
            })
            .then(function (users) {
                console.log(`Room ${prevRoomID} has users:`, users);
                return Delay(1000)
            })
            .then(function () {
                return room.joinRandomRoom()
            })
    }, 1000)

    return room
        .joinRoom({
            roomID: roomID
        })
        .then(function (roomConfig) {
            console.log(`${userID}: Join room ${roomConfig.roomID}`)
            return Promise.resolve(roomConfig);
        })
}

var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: Demo,
    plugins: {
        global: [{
            key: 'rexFire',
            plugin: FirebasePlugin,
            start: true
        }]
    }
};

var game = new Phaser.Game(config);