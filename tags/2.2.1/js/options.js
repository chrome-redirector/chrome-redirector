/**
 * Interactive
 */

function _init() {
    ext_bg = chrome.extension.getBackgroundPage(); // Background page
    ruleList = new RuleList();
    _pref = new _Pref();
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
                              function(e) {
                                  ruleList.chg = true;
                              },
                              false);
    langSel.addEventListener("change",
                             lang.onSelLang.bind(lang),
                             false);
}

function switchNavTag(e)        // Switch navigation Bar
{
    var tag = e.srcElement;
    navBar.getElementsByClassName("navTagSel")[0].className
        = "navTag";
    tag.className = "navTag navTagSel";

    main.getElementsByClassName("mainview-sel")[0].className
        = "mainview";

    switch (tag.id) {
    case "prefTag":
        pref.className = "mainview-sel"; break;
    case "ruleMgrTag":
        ruleMgr.className = "mainview-sel"; break;
    case "docTag":
        doc.className = "mainview-sel"; break;
    default:
        console.log('Oops!');
    }
}
