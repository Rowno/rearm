/*globals _:false */

(function () {
    'use strict';

    var i = 0;
    var canvas = document.getElementById('canvas');
    var image = document.getElementById('icon-active');
    var context = canvas.getContext('2d');


    var ActiveTabIds = {
        get: function (callback) {
            chrome.storage.local.get('activeTabIds', function (items) {
                callback(items.activeTabIds || []);
            });
        },
        set: function (activeTabIds) {
            chrome.storage.local.set({'activeTabIds': activeTabIds});
        }
    };

    function setIcon(state, tabId) {
        chrome.browserAction.setIcon({
            tabId: tabId,
            path: {
                '19': 'icon-' + state + '.png'
            }
        });
    }


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
            setIcon('active', tabId);
        } else if (message === 'deactivated') {
            setIcon('inactive', tabId);
        } else if (message === 'reload') {
            var interval = setInterval(function () {
                i += 20;

                if (i > 180) {
                    clearInterval(interval);
                    return;
                }

                context.save();
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.translate(image.width / 2, image.width / 2);
                context.rotate(i * Math.PI / 180);
                context.drawImage(image, -image.width / 2, -image.height / 2);
                context.restore();

                chrome.browserAction.setIcon({
                    imageData: context.getImageData(0, 0, 19, 19),
                    tabId: tabId
                });
            }, 60);
        }
    });
}());
