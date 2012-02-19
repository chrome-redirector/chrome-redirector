/**
 * Interactive
 */

/*jslint nomen: false, undef: false */
/*global chrome: true, ext_bg: true,
  RuleList: true, Pref: true, Lang: true,
  navTags: true, ruleListTable: true, */

function switchNavTag(e) {      // Switch navigation Bar
    var tag = e.srcElement;
    navBar.getElementsByClassName("navTagSel")[0].className =
        "navTag";
    tag.className = "navTag navTagSel";

    main.getElementsByClassName("mainview-sel")[0].className =
        "mainview";

    switch (tag.id) {
    case "prefTag":
        pref.className = "mainview-sel";
        break;
    case "ruleMgrTag":
        ruleMgr.className = "mainview-sel";
        break;
    case "docTag":
        doc.className = "mainview-sel";
        break;
    default:
        console.log('Oops!');
    }
}

function _init() {
    ext_bg = chrome.extension.getBackgroundPage(); // Background page
    ruleList = new RuleList();
    _pref = new Pref();
    lang = new Lang();

    // Event listeners
    navTags.addEventListener("click", switchNavTag, false);
    ruleListTable.addEventListener("click",
                                   ruleList.onSel.bind(ruleList),
                                   false);
    ruleEdit_sel.addEventListener("change",
                                  ruleList.selBuiltin.bind(ruleList),
                                  false);
    ruleEdit.addEventListener("change",
                              function (e) {
                                  ruleList.chg = true;
                              },
                              false);
    langSel.addEventListener("change",
                             lang.onSelLang.bind(lang),
                             false);
}

function verifyUrl(url) {
    if (! /^(https?|ftp|file):\/\//i.test(url)) {
        err(lang.notif['URL-INVALID-PROTO']);
        return false;
    }

    if (/\s/i.test(url)) {
        err(lang.notif['URL-INVALID-CHAR']);
        return false;
    }

    return true;
}