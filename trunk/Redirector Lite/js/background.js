/**
 * Filename: background.js
 */

function init() {
	hasUpdate = true;
	urlCached = {};
	updateData();
//	cacheNum = 0;
}

/*
chrome.experimental.webNavigation.onBeforeNavigate.addListener(function(details) {
	if(!pref[0]) {
		return;
	}

	for(var i in ruleList) {
		if(!ruleList[i][6]) {
			continue;
		}
		var whitelist = eval(ruleList[i][1]);
		var blacklist = eval(ruleList[i][2]);
		var subStr = eval(ruleList[i][3]);
		var repl = ruleList[i][4];

		if(whitelist.test(details.url) && !blacklist.test(details.url)) {
			chrome.tabs.update(details.tabId, {url: details.url.replace(subStr, repl)});
			return;
		}
	}
});
*/

function updateData() {
	try {
		ruleList = JSON.parse(localStorage.ruleList);
	} catch(e) {
		ruleList = [["Untitled", "", "", "", "", "", false]];
	}

	try {
		manRedirList = JSON.parse(localStorage.manRedirList);
	} catch(e) {
		manRedirList = [];
	}

	try {
		pref = JSON.parse(localStorage.pref);
	} catch(e) {
		pref = [true, true];
	}
}

chrome.pageAction.onClicked.addListener(function(tab) {
	if(!pref[1]) {
		return;
	}

	var originalUrl = cacheUrl(tab.url, "get");

	outermost:
	for(var i in manRedirList) {
		for(var j in ruleList) {
			if(ruleList[j][0] == manRedirList[i] && tab.url == originalUrl.replace(eval(ruleList[j][3]), ruleList[j][4])) {
				i++;
				ruleIndex = i;
				break outermost;
			}
		}
		if(i == manRedirList.length - 1) {
			ruleIndex = 0;
		}
	}

	if(ruleIndex < manRedirList.length) {
		for(var i in ruleList) {
			if(ruleList[i][0] == manRedirList[ruleIndex]) {
				var subStr = eval(ruleList[i][3]);
				var repl = ruleList[i][4];
				newUrl = originalUrl.replace(subStr, repl);
				break;
			}
		}
	} else {
		ruleIndex = 0;
		newUrl = originalUrl;
	}

	chrome.tabs.update(tab.id, {
		url: newUrl
	});
	cacheUrl(newUrl, originalUrl);
});

chrome.tabs.onCreated.addListener(function(tab) {
	chrome.pageAction.show(tab.id);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	chrome.pageAction.show(tab.id);
});

chrome.extension.onConnect.addListener(function (port) {
	port.onMessage.addListener(function(msg) {
		if(port.name == "link") {
			linkUrl = msg.url;
			msg.url = null;

			chrome.tabs.getSelected(null, function(tab) {
				if(linkUrl) {
					chrome.tabs.create({
						index: tab.index + 1,
						url: linkUrl
					}, null);
				}
			});
		} else if(port.name == "update") {
			updateData();
		}
	});
});

function cacheUrl(url, opt) {
	if(opt != "get") {
		urlCached[url] = opt;
		return;
	}

	if(!urlCached[url]) {
		urlCached[url] = url;
		return url;
	}

	while(url != urlCached[url]) {
		url = urlCached[url];
	}
	return url;
}

//chrome.management.onInstalled.addListener(function(info) {
//});
