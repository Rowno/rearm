/*jshint browser:true */

(function () {
    'use strict';

    var HOSTNAME = window.location.hostname + ':35729';


    function activate() {
        var scriptElement = document.createElement('script');

        scriptElement.src = 'http://' + HOSTNAME + '/livereload.js';
        document.body.appendChild(scriptElement);


        var connection = new WebSocket('ws://' + HOSTNAME + '/livereload');

        connection.onopen = function () {
            connection.send(JSON.stringify({
                command: 'hello',
                protocols: [
                    'http://livereload.com/protocols/official-7'
                ]
            }));
        };

        connection.onmessage = function (event) {
            var data = JSON.parse(event.data);

            if (data.command === 'reload') {
                chrome.runtime.sendMessage(null, 'reload');
            }
        };

        chrome.runtime.sendMessage(null, 'activated');
    }

    function deactivate() {
        chrome.runtime.sendMessage(null, 'deactivated');
        document.location.reload();
    }


    chrome.runtime.sendMessage(null, 'isActive', function (isActive) {
        if (isActive) {
            activate();
        }
    });

    chrome.runtime.onMessage.addListener(function (message) {
        if (message === 'activate') {
            activate();
        } else if (message === 'deactivate') {
            deactivate();
        }
    });
}());
