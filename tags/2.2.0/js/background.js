/**
 * Background
 */

langNotif = (new Lang()).notif;
updatePref();
updateRule();

// Auto redirect
chrome.webRequest.onBeforeRequest.addListener(
    function(tmp) {
        if (ruleAuto.length == 0) return; // return if no rules

        for (var i in ruleAuto) {
            if (ruleAuto[i].match.test(tmp.url)) { // match
                if (ruleAuto[i].sub === null) {    // To block
                    return {cancel: true};
                } else {        // To redirect
                    return {redirectUrl: tmp.url.replace(
                        ruleAuto[i].sub, ruleAuto[i].repl)};
                }
            }
        }
    },
    {urls: validUrl},
    ['blocking']
);

// Manual redirect
chrome.pageAction.onClicked.addListener(function(tab) {
    if (ruleManual.length == 0) return;

    chrome.tabs.update(tab.id, {
        url: tab.url.replace(ruleManual[0].sub, ruleManual[0].repl)
    });
});

// Show icon in omnibar
if (typeof prefData.hideIcon == 'undefined' || ! prefData.hideIcon) {
    chrome.tabs.onCreated.addListener(showIcon);
    chrome.tabs.onUpdated.addListener(showIcon);
}

function showIcon(t) {
    if (typeof prefData.hideIcon != 'undefined' && prefData.hideIcon)
        return;

    if (typeof t == 'number')
        chrome.pageAction.show(t);
    else
        chrome.pageAction.show(t.id);
}

function updatePref() {
    prefData = (new _Pref()).data;

    if (prefData.proto.all) {
        validUrl = ['<all_urls>'];
    } else {
        validUrl = [];
        if (prefData.proto.http) validUrl.push('http://*/*');
        if (prefData.proto.https) validUrl.push('https://*/*');
        if (prefData.proto.ftp) validUrl.push('ftp://*/*');
        if (prefData.proto.file) validUrl.push('file://*');
    }
}

function updateRule() {         // Called when data need update
    try {                       // Load prototype of rules
        var ruleData = JSON.parse(localStorage.RULELIST);
    } catch (e) {
        var ruleData = [];
    }

    ruleAuto = [];              // Rules for auto redir
    ruleManual = [];            // Rules for manual redir
    for (var i in ruleData) {
        var rule=ruleData[i];   // Current rule

        // Rule must be enabled
        if (typeof rule.enabled === 'undefined' || ! rule.enabled)
            continue;

        // For a manual rule
        if (rule.match.type == TYPE_MANUAL) {
            if (rule.sub.type == TYPE_BLOCK) {
                alert(langNotif['MANUAL-BLOCK']);
                continue;
            }

            if (ruleManual.length == 0) {
                try {
                    var tmp = {
                        sub: str2re(rule.sub),
                        repl: rule.repl};
                } catch (e) {
                    continue;
                }

                ruleManual = [tmp];
            } else {
                alert(langNotif['MULTI-MANUAL']);
            }

            continue;
        }

        // For an auto rule
        try {
            var tmp={
                match: str2re(rule.match),
                sub: str2re(rule.sub),
                repl: rule.repl};
        } catch (e) {
            continue;
        }

        ruleAuto.push(tmp);
    }
}