/* Interactivity.

   Copyright (C) 2010-2012.

   This file is part of Redirector.

   Redirector is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   Redirector is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with Redirector.  If not, see <http://www.gnu.org/licenses/>.

   From Cyril Feng. */

/*jslint browser: true, onevar: false, plusplus: false*/
/*global $: true, $$: true, $v: true, $f: true, $i18n: true*/
/*global chrome: true, RuleList: true, Pref: true, Debugger: true*/

// Navbar
switchNav = function () {
    [].forEach.call($$('#navTags .selected'), function (tag) {
        tag.className = '';
    });

    try {
        $$('#navTags li:hover')[0].className = 'selected';
    } catch (e) {               // Switched by script
        switch (location.search) {
        case '?1':
            $$('#navTags li')[1].className = 'selected';
            break;
        case '?2':
            $$('#navTags li')[2].className = 'selected';
            break;
        default:
            $$('#navTags li')[0].className = 'selected';
        }
    }

    $('main-container').className = 'selected';
    $('main-container').style.margin = '0 -20px';
    $('main-container').style.opacity = 0;
};

$f.verifyUrl = function (url) { // Verify a URL (Not strict enough)
    if (! /^(https?|ftp|file):\/\//i.test(url)) { // Left out protocol
        $f.err($i18n('TEST_INVALID_PROTO'));
        return false;
    }

    if (/\s/i.test(url)) {      // Contains whitespaces
        $f.err($i18n('TEST_INVALID_CHAR'));
        return false;
    }

    return true;                // Is a valid URL
};

window.onload = function () {         // Option page init
    $f.applyI18n();             // Apply i18n messages

    // Rulelist navigation
    $$('body')[0].addEventListener('keydown', function (e) {
        if ($$('#ruleMgr:target').length === 0 ||
            $$('#overlay:hover').length > 0 ||
            $$('#navBar:hover').length > 0) {
            return;
        }

        switch (e.keyCode) {
        case 38: case 75:       // Up/k
            $v.ruleList.move(-1);
            break;
        case 40: case 74:       // Down/j
            $v.ruleList.move(1);
            break;
        case 46:                // Delete
            $v.ruleList.del();
            break;
        case 13:                // Enter
            $v.ruleList.edit();
        default:
            return;
        }

        e.preventDefault();
        return false;
    });

    // Navigation bar (work with switchNav)
    var transitionEndEvent = window.TransitionEvent ?
        'transitionEnd' : 'webkitTransitionEnd';
    $('main-container').addEventListener(
        transitionEndEvent,
        function (e) {           // Fade in
            $('main-container').className = '';
            $('main-container').style.margin = '0 0';
            $('main-container').style.opacity = 1;
        }, false);

    // Rules editor animation
    $('overlay').addEventListener('click',  function (e) {
        if (e.srcElement.id === 'overlay') {
            e.target.classList.add('shake');
        }
    }, false);
    var animationEndEvent = window.AnimationEnd ?
        'animationEnd' : 'webkitAnimationEnd'
    $('overlay').addEventListener(animationEndEvent, function (e) {
        e.target.classList.remove('shake');
    }, false);

    // Rules list click event
    $('ruleListTable').addEventListener(
        "click", $v.ruleList.onSel.bind($v.ruleList), false);
    // Rule changed event
    $('ruleEdit').addEventListener(
        "change",
        function (e) {
            $v.ruleList.chg = true;
        },
        false);

    switch (location.search) {
    case '?1':
        // Display the rules manager tab
        $$('#ruleMgrTag a')[0].click();
        break;
    case '?2':
        // Display the debugger tab
        $$('#dbgTag a')[0].click();
        break;
    default:
        // Display the preferences tab
        $$('#prefTag a')[0].click();
    }

    chrome.tabs.getCurrent(function (tab) {
        $v.ext_bg.$v.optionTabId = tab.id;
    });
};

document.addEventListener('DOMContentLoaded', function () {
    $v.ext_bg = chrome.extension.getBackgroundPage(); // Bg page
    $v.pref = new Pref();         // Preferences obj
    $v.ruleList = new RuleList(); // Rules list obj
    $v.debugger = new Debugger(); // Debugger obj
    $v.pref.onChgPrompt();      // Will create prompts objs

    // Navigation bar
    [].forEach.call($$('#navTags a'), function (link) {
        link.addEventListener('click', switchNav);
    });

    // Toggle protocols
    $('pref_proto_all').addEventListener('click', function () {
        $v.pref.onChgProto("all").bind($v.pref);
    });
    $('pref_proto_http').addEventListener('click', function () {
        $v.pref.onChgProto("http").bind($v.pref);
    });
    $('pref_proto_https').addEventListener('click', function () {
        $v.pref.onChgProto("https").bind($v.pref);
    });
    $('pref_proto_ftp').addEventListener('click', function () {
        $v.pref.onChgProto("ftp").bind($v.pref);
    });
    $('pref_proto_file').addEventListener('click', function () {
        $v.pref.onChgProto("file").bind($v.pref);
    });

    $('pref_context_link').addEventListener(
        'click', $v.pref.onChgContext.bind($v.pref)
    );
    $('pref_context_page').addEventListener(
        'click', $v.pref.onChgContext.bind($v.pref)
    );
    $('pref_prompt').addEventListener(
        'click', $v.pref.onChgPrompt.bind($v.pref)
    );
    $('pref_pageAction').addEventListener(
        'click', $v.pref.onChgPageAction.bind($v.pref)
    );
    $('ruleContextMenu').addEventListener('mouseover', function () {
        clearTimeout(this.timeOut)
    });
    $('ruleContextMenu').addEventListener('mouseout', function () {
        this.timeOut = setTimeout(
            function () {
                $('ruleContextMenu').className = '';
            }, 1000
        );
    });

    $('ruleMgr-add').addEventListener('click', $v.ruleList.add);
    $('ruleMgr-edit').addEventListener('click', $v.ruleList.edit);
    $('ruleMgr-del').addEventListener('click', $v.ruleList.del);
    $('ruleMgr-move_up').addEventListener('click', function () {
        $v.ruleList.move(-1);
    });
    $('ruleMgr-move_down').addEventListener('click', function () {
        $v.ruleList.move(1);
    });

    [].forEach.call($$('#scroll-area'), function (area) {
        area.addEventListener('click', function () {
            scroll(0, 0);
        });
    });

    $('ruleList-bak').addEventListener('click', $v.ruleList.bak);
    $('ruleList-restore').addEventListener('click', $v.ruleList.restore);
    $('ruleList-export').addEventListener('click', function () {
        $v.ruleList.bak(true);
    });
    $('ruleList-import').addEventListener('click', function () {
        $v.ruleList.restore(true);
    });

    $('ruleList-remote-update').addEventListener('click', function () {
        $v.ruleList.updateRemoteRule(true);
    });
    $('ruleList-remote-del').addEventListener(
        'click',
        $v.ruleList.removeRemoteRule
    );

    $('ruleListTable-new').addEventListener('click', function () {
        event.preventDefault();
        $v.ruleList.add();
        return false;
    });

    $('dbg-form').addEventListener('submit', function () {
        return false;
    });

    $('dbg-chkbox-1').addEventListener('change', function () {
        $v.debugger.quiet = this.checked;
    });
    $('dbg-chkbox-2').addEventListener('change', function () {
        $v.debugger.trackRedir = this.checked;
    });
    $('dbg-chkbox-3').addEventListener('change', function () {
        $v.debugger.trackReqHdr = this.checked;
    });
    $('dbg-chkbox-4').addEventListener('change', function () {
        $v.debugger.trackRespHdr = this.checked;
    });
    $('dbg-chkbox-5').addEventListener('change', function () {
        $v.debugger.testSpeed = this.checked;
    });

    $('dbg_start').addEventListener('click', function () {
        $('dbg_start').hidden = true;
        $('dbg_stop').hidden = false;
        $v.debugger.start();
    });
    $('dbg_stop').addEventListener('click', function () {
        $('dbg_stop').hidden = true;
        $('dbg_start').hidden = false;
        $v.debugger.stop();
    });
    $('dbg_unfold').addEventListener('click', function () {
        this.hidden = true;
        $('dbg_fold').hidden = false;
        $v.debugger.openDetails(true);
    });
    $('dbg_fold').addEventListener('click', function () {
        this.hidden = true;
        $('dbg_unfold').hidden = false;
        $v.debugger.openDetails(false);
    });
    $('dbg_clear').addEventListener('click', function () {
        $('dbg_unfold').hidden = true;
        $('dbg_fold').hidden = true;
        $('dbg_info').innerHTML = '';
    });

    $('dbg-export').addEventListener('click', $v.debugger.export);
    $('dbg-import').addEventListener('click', $v.debugger.import);

    $('ruleEdit').addEventListener('click', function () {
        return false;
    });

    $('ruleEdit_matchtype').addEventListener('click', $v.ruleList.onChgMatchType.bind($v.ruleList));
    $('ruleEdit_matchContent').addEventListener('click', function () {
        t = $('ruleEdit_matchContentType');
        if (t.style.display !== 'block') {
            t.style.display = 'block';
            t.style.left = this.offsetLeft + 'px';
        }else{
            t.style.display = 'none';
        }
    });

    $('rmct1').addEventListener('click', function () {
        that = this;[].forEach.call(
            $$('#ruleEdit_matchContentType input'),
            function (i){
                i.checked = that.checked;
            }
        );
    });
    [].forEach.call($$('#rmcts'), function (rmct) {
        rmct.addEventListener('click', function () {
            $$('#ruleEdit_matchContentType' + ' input')[0].checked = false;
        });
    });

    $('ruleEdit_subtype').addEventListener('change', $v.ruleList.onChgSubType.bind($v.ruleList));
    $('ruleEdit-save').addEventListener('click', $v.ruleList.save.bind($v.ruleList));
    $('ruleEdit-discard').addEventListener('click', $v.ruleList.discard.bind($v.ruleList));

    $('ruleEdit-test').addEventListener('click', $v.ruleList.test.bind($v.ruleList));
    $('layerNotif').addEventListener('click', function () {
        this.className = '';
    });
});
