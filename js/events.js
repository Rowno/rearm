/*globals _:false */


var ActiveTabIds = (function () {
    'use strict';

    var exports = {};


    function get(callback) {
        chrome.storage.local.get('activeTabIds', function (items) {
            callback(items.activeTabIds || []);
        });
    }
    exports.get = get;

    function set(activeTabIds) {
        chrome.storage.local.set({'activeTabIds': activeTabIds});
    }
    exports.set = set;

    return exports;
}());


var Icon = (function () {
    'use strict';

    var exports = {};
    var animatingTabIds = [];
    var canvas = document.getElementById('canvas');
    var image = document.getElementById('icon-active');
    var context = canvas.getContext('2d');
    var size = image.width;

    canvas.width = size;
    canvas.height = size;


    function set(state, tabId) {
        if (animatingTabIds.indexOf(tabId) !== -1) {
            return;
        }

        chrome.browserAction.setIcon({
            tabId: tabId,
            path: {
                '19': 'img/icon-' + state + '.png'
            }
        });
    }


    function activate(tabId) {
        set('active', tabId);
    }
    exports.activate = activate;

    function deactivate(tabId) {
        set('inactive', tabId);
    }
    exports.deactivate = deactivate;

    function animate(tabId) {
        if (animatingTabIds.indexOf(tabId) !== -1) {
            return;
        }

        var i = 0;
        animatingTabIds.push(tabId);

        var interval = setInterval(function () {
            i += 15;

            if (i > 360) {
                clearInterval(interval);
                animatingTabIds.splice(animatingTabIds.indexOf(tabId), 1);
                return;
            }

            context.save();
            context.clearRect(0, 0, size, size);
            context.translate(size / 2, size / 2);
            context.rotate(i * Math.PI / 180);
            context.drawImage(image, -size / 2, -size / 2);
            context.restore();

            chrome.browserAction.setIcon({
                imageData: context.getImageData(0, 0, size, size),
                tabId: tabId
            });
        }, 60);
    }
    exports.animate = animate;

    return exports;
}());


(function (Icon, ActiveTabIds) {
    'use strict';

    chrome.browserAction.onClicked.addListener(function (tab) {
        var tabId = tab.id;

        ActiveTabIds.get(function (activeTabIds) {
            var index = activeTabIds.indexOf(tabId);

            if (index === -1) {
                activeTabIds.push(tabId);
                chrome.tabs.sendMessage(tabId, 'activate');
            } else {
                activeTabIds.splice(index, 1);
                chrome.tabs.sendMessage(tabId, 'deactivate');
            }

            ActiveTabIds.set(activeTabIds);
        });
    });

    chrome.tabs.onRemoved.addListener(function (tab) {
        var tabId = tab.id;

        ActiveTabIds.get(function (activeTabIds) {
            var index = activeTabIds.indexOf(tabId);

            if (index !== -1) {
                activeTabIds.splice(index, 1);
                ActiveTabIds.set(activeTabIds);
            }
        });
    });

    // Garbage collection
    chrome.runtime.onStartup.addListener(function () {
        ActiveTabIds.get(function (activeTabIds) {
            chrome.tabs.query({}, function (tabs) {
                var allTabIds = _.pluck(tabs, 'id');
                activeTabIds = _.intersection(activeTabIds, allTabIds);
                ActiveTabIds.set(activeTabIds);
            });
        });
    });

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (!sender.tab) {
            return;
        }

        var tabId = sender.tab.id;

        if (message === 'isActive') {
            ActiveTabIds.get(function (activeTabIds) {
                var isActive = activeTabIds.indexOf(tabId) !== -1;
                sendResponse(isActive);
            });
            return true;
        } else if (message === 'activated') {
            Icon.activate(tabId);
        } else if (message === 'deactivated') {
            Icon.deactivate(tabId);
        } else if (message === 'reload') {
            Icon.animate(tabId);
        }
    });
}(Icon, ActiveTabIds));
