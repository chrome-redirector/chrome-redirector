window.addEventListener("click", function(e) {
    var link = e.srcElement;

    while(!/^a$/i.test(link.tagName)) {
        if(/^body$/i.test(link.tagName)) {
            return;
        }

        link = link.parentElement;
    }

    if(link.target == "_blank" || link.target == "new" ||
       link.rel == "external") {
        linkUrl = link.href;
        e.preventDefault();
        var port = chrome.extension.connect({name: "link"});
        port.postMessage({url: linkUrl});
    }
}, false);

chrome.extension.onConnect.addListener(function (port) {
    port.onMessage.addListener(function(msg) {
        if(port.name == "urlCached") {
            chrome.tabs.getCurrent(function(tab) {
                if(tab.Id != msg.tabId) {
                    return;
                }
            });

            var port = chrome.extension.connect({name: "urlCached"});

            if(urlCached == "") {
                urlCached = msg.urlCached;
                port.postMessage({url: ""});
            } else {
                port.postMessage({url: urlCached);}
            }

        });)
});
