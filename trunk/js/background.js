/**
 * Background
 */

/*jslint plusplus: false */
/*global chrome: true, tmp: true,
  TYPE_REGEXP: true, TYPE_GLOB: true, TYPE_MANUAL: true,
  TYPE_BLOCK: true,
  Pref: true, prefData: true, RuleList: true, ruleData: true,
  Lang: true, langNotif: true,
  validUrl: true, ruleManual: true, ruleAuto: true,
  getRedirUrl: true, str2re: true, alert: true */

function loadPref() {           // Load preferences data
    prefData = (new Pref()).data; // All preferences data

    if (prefData.proto.all) {      // All protocols enabled
        validUrl = ['<all_urls>']; // Matches all protocols
    } else {
        validUrl = [];
        if (prefData.proto.http) { // http:// enabled
            validUrl.push('http://*/*');
        }
        if (prefData.proto.https) { // https:// enabled
            validUrl.push('https://*/*');
        }
        if (prefData.proto.ftp) { // ftp:// enabled
            validUrl.push('ftp://*/*');
        }
        if (prefData.proto.file) { // file:// enabled
            validUrl.push('file://*');
        }
    }
}

function updateContext() {      // Update the context menu
    var parentLink, parentPage, idx;

    function newTab(info, tab) { // Open a new tab
        chrome.tabs.create({
            url: getRedirUrl(
                info.linkUrl,
                ruleManual[info.menuItemId - newTab.idx - 1]
            )
        });
    }

    function inTab(info, tab) { // Reload current tab
        chrome.tabs.update(tab.id, {
            url: getRedirUrl(
                info.pageUrl,
                ruleManual[info.menuItemId - inTab.idx - 1]
            )
        });
    }

    if (ruleManual.length === 0) { // No manual rule
        return;
    }

    chrome.contextMenus.removeAll(); // Remove previous created menus

    if (prefData.context.link) { // Re-generate links' context menu
        parentLink = chrome.contextMenus.create({ // Parent entry
            title: 'Open link with rule',
            contexts: ['link']
        });

        for (var i = 0; i < ruleManual.length; i++) { // Sub entries
            newTab.idx = parentLink;
            chrome.contextMenus.create({
                title: ruleManual[i].name,
                contexts: ['link'],
                parentId: parentLink,
                onclick: newTab
            });
        }
    }

    if (prefData.context.page) { // Re-generate pages' context menu
        parentPage = chrome.contextMenus.create({ // Parent entry
            title: 'Reload page with rule'
        });

        for (var i = 0; i < ruleManual.length; i++) { // Sub entries
            inTab.idx = parentPage;
            chrome.contextMenus.create({
                title: ruleManual[i].name,
                parentId: parentPage,
                onclick: inTab
            });
        }
    }
}

function loadRule() {         // Called when rule list needs update
    var rule;

    ruleData = (new RuleList(false)).data; // All rules list data

    ruleAuto = [];              // Rules for auto redir
    ruleManual = [];            // Rules for manual redir
    for (var i = 0; i < ruleData.length; i++) {
        rule = ruleData[i];     // Current rule

        // Rule must be enabled
        if (! rule.hasOwnProperty('enabled') || ! rule.enabled) {
            continue;
        }

        // For a manual rule
        if (rule.match.type === TYPE_MANUAL) {
            if (rule.sub.type === TYPE_BLOCK) {
                alert(langNotif['MANUAL-BLOCK']);
                continue;
            }

            try {
                tmp = {         // Tmp manual rule, to be chked
                    name: rule.name,
                    sub: str2re(rule.sub),
                    repl: rule.repl.str,
                    decode: rule.repl.decode
                };
                // RegExp syntax error
                if (! tmp.sub.hasOwnProperty('global')) {
                    alert(tmp.sub.toString());
                    return;
                }
            } catch (e) {
                continue;
            }

            ruleManual.push(tmp); // Formally add to manual rule
            continue;
        }

        // For an auto rule
        try {
            tmp = {             // Tmp auto rule, to be chked
                match: str2re(rule.match),
                sub: str2re(rule.sub),
                repl: rule.repl.str,
                decode: rule.repl.decode
            };
            // Check match/sub to see if RegExp syntax error
            if (! tmp.match.hasOwnProperty('global')) {
                alert(tmp.match.toString());
                return;
            }
            if (! tmp.sub.hasOwnProperty('global')) {
                alert(tmp.sub.toString());
                return;
            }
        } catch (e) {
            continue;
        }

        ruleAuto.push(tmp);     // Formally add to auto rule
    }

    updateContext();            // Now referesh context menu
}

langNotif = (new Lang()).notif; // Load language settings
loadPref();                     // Load preferences data
loadRule();                     // Load rule list

chrome.webRequest.onBeforeRequest.addListener( // Auto redirect
    function (tmp) {
        if (ruleAuto.length === 0) { // No auto rule
            return;
        }

        for (var i = 0; i < ruleAuto.length; i++) {
            if (ruleAuto[i].match.test(tmp.url)) { // match this URL
                if (ruleAuto[i].sub === null) {    // To block
                    return {cancel: true};
                } else {        // To redirect
                    return {redirectUrl:
                            getRedirUrl(tmp.url, ruleAuto[i])};
                }
            }
        }
    },
    {urls: validUrl},
    ['blocking']
);

// errLog = '';                    // Error log
// // Error of auto redirect
// chrome.webRequest.onErrorOccurred.addListener(
//     function (err) {
//         // Only handle errors in normal main_frame & normal tab
//         if (err.frameId !== 0 || err.tabId < 0 ||
//             err.type !== 'main_frame') {
//             return;
//         }

//         // DBG(err);               // Write debug info
//         errLog += JSON.stringify(err);
//     },
//     {urls: validUrl}
// );
