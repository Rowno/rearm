/*jshint browser:true */

(function () {
    'use strict';

    var HOSTNAME = window.location.hostname + ':35729';


    function activate() {
        var scriptElement = document.createElement('script');

        scriptElement.src = 'http://' + HOSTNAME + '/livereload.js';
        document.body.appendChild(scriptElement);

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
