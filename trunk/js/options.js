/**
 * Interactive
 */

/*global chrome: true, document: true, console: true, ext_bg: true,
  RuleList: true, ruleList: true, Pref: true, myPref: true,
  Lang: true, lang: true,
  err: true */

function switchNavTag(e) {      // Switch navigation Bar
    var tag = e.srcElement;
    document.getElementById('navBar').getElementsByClassName(
        "navTagSel")[0].className = "navTag";
    tag.className = "navTag navTagSel";

    document.getElementById('main').getElementsByClassName(
        "mainview-sel")[0].className = "mainview";

    switch (tag.id) {
    case "prefTag":
        document.getElementById('pref').className = "mainview-sel";
        break;
    case "ruleMgrTag":
        document.getElementById('ruleMgr').className = "mainview-sel";
        break;
    case "docTag":
        document.getElementById('doc').className = "mainview-sel";
        break;
    default:
        console.log('Oops!');
    }
}

function onInit() {
    ext_bg = chrome.extension.getBackgroundPage(); // Background page
    ruleList = new RuleList();
    myPref = new Pref();
    lang = new Lang();

    // Event listeners
    document.getElementById('navTags').addEventListener(
        "click",
        switchNavTag,
        false);
    document.getElementById('ruleListTable').addEventListener(
        "click",
        ruleList.onSel.bind(ruleList),
        false);
    document.getElementById('ruleEdit_sel').addEventListener(
        "change",
        ruleList.selBuiltin.bind(ruleList),
        false);
    document.getElementById('ruleEdit').addEventListener(
        "change",
        function (e) {
            ruleList.chg = true;
        },
        false);
    document.getElementById('langSel').addEventListener(
        "change",
        lang.onSelLang.bind(lang),
        false);
}

function verifyUrl(url) {
    if (! /^(https?|ftp|file):\/\//i.test(url)) {
        err(lang.i18n['URL-INVALID-PROTO']);
        return false;
    }

    if (/\s/i.test(url)) {
        err(lang.i18n['URL-INVALID-CHAR']);
        return false;
    }

    return true;
}