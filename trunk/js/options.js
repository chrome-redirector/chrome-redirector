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
    $e($$('body')[0], function (e) {
        if ($$('#ruleMgr:target').length === 0 ||
            $$('#overlay:hover').length > 0 ||
            $$('#navBar:hover').length > 0) {
            return true;
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
            return true;
        }

        e.preventDefault();
        return false;
    }, 'keydown');

    // Navigation bar (work with switchNav)
    var transitionEndEvent = window.TransitionEvent ?
        'transitionEnd' : 'webkitTransitionEnd';
    $e($('main-container'), function (e) { // Fade in
        $('main-container').className = '';
        $('main-container').style.margin = '0 0';
        $('main-container').style.opacity = 1;
    }, transitionEndEvent);

    // Rules editor animation
    $e($('overlay'),  function (e) {
        if (e.srcElement.id === 'overlay') {
            e.target.classList.add('shake');
        }
    });
    var animationEndEvent = window.AnimationEnd ?
        'animationEnd' : 'webkitAnimationEnd';
    $e($('overlay'), function (e) {
        e.target.classList.remove('shake');
    }, animationEndEvent);

    // Rules list click event
    $e($('ruleListTable'), $v.ruleList.onSel.bind($v.ruleList));
    // Rule changed event
    $e($('ruleEdit'), function (e) {
        $v.ruleList.chg = true;
    }, 'change');

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
    $v.pref.onChgPrompt();        // Will create prompts objs

    // Navigation bar
    [].forEach.call($$('#navTags a'), function (link) {
        $e(link, switchNav);
    });

    // Toggle protocols, id fmt: pref_proto_<proto>
    [].forEach.call($$('.pref-protos'), function (proto) {
        $e(proto, function () {
            $v.pref.onChgProto(proto.id.split('_')[2]);
        });
    });

    [$('pref_context_link'), $('pref_context_page')].forEach(function (elem) {
        $e(elem, $v.pref.onChgContext.bind($v.pref));
    });
    $e($('pref_prompt'), $v.pref.onChgPrompt.bind($v.pref));
    $e($('pref_pageAction'), $v.pref.onChgPageAction.bind($v.pref));
    $e($('ruleContextMenu'), function () {
        clearTimeout(this.timeOut);
    }, 'mouseover');
    $e($('ruleContextMenu'), function () {
        this.timeOut = setTimeout(function () {
            $('ruleContextMenu').className = '';
        }, 1000);
    }, 'mouseout');

    $e($('ruleMgr-add'), $v.ruleList.add.bind($v.ruleList));
    $e($('ruleMgr-edit'), $v.ruleList.edit.bind($v.ruleList));
    $e($('ruleMgr-del'), $v.ruleList.del.bind($v.ruleList));
    $e($('ruleMgr-move_up'), function () {
        $v.ruleList.move(-1);
    });
    $e($('ruleMgr-move_down'), function () {
        $v.ruleList.move(1);
    });

    [].forEach.call($$('#scroll-area'), function (area) {
        $e(area, function () {
            scroll(0, 0);
        });
    });

    $e($('ruleList-bak'), function () {$v.ruleList.bak();});
    $e($('ruleList-restore'), function () {$v.ruleList.restore();});
    $e($('ruleList-export'), function () {
        $v.ruleList.bak(true);
    });
    $e($('ruleList-import'), function () {
        $v.ruleList.restore(true);
    });

    $e($('ruleList-remote-update'), function () {
        $v.ruleList.updateRemoteRule(true);
    });
    $e($('ruleList-remote-del'),
       $v.ruleList.removeRemoteRule.bind($v.ruleList));

    $e($('ruleListTable-new'), function () {
        event.preventDefault();
        $v.ruleList.add();
        return false;
    });

    [].forEach.call($$('.form-nosubmit'), function (form) {
        $e(form, function (e) {
            e.preventDefault();
        }, 'submit');
    });

    $e($('dbg-chkbox-1'), function () {
        $v.debugger.quiet = this.checked;
    }, 'change');
    $e($('dbg-chkbox-2'), function () {
        $v.debugger.trackRedir = this.checked;
    }, 'change');
    $e($('dbg-chkbox-3'), function () {
        $v.debugger.trackReqHdr = this.checked;
    }, 'change');
    $e($('dbg-chkbox-4'), function () {
        $v.debugger.trackRespHdr = this.checked;
    }, 'change');
    $e($('dbg-chkbox-5'), function () {
        $v.debugger.testSpeed = this.checked;
    }, 'change');

    $e($('dbg_start'), function () {
        $('dbg_start').hidden = true;
        $('dbg_stop').hidden = false;
        $v.debugger.start();
    });
    $e($('dbg_stop'), function () {
        $('dbg_stop').hidden = true;
        $('dbg_start').hidden = false;
        $v.debugger.stop();
    });
    $e($('dbg_unfold'), function () {
        this.hidden = true;
        $('dbg_fold').hidden = false;
        $v.debugger.openDetails(true);
    });
    $e($('dbg_fold'), function () {
        this.hidden = true;
        $('dbg_unfold').hidden = false;
        $v.debugger.openDetails(false);
    });
    $e($('dbg_clear'), function () {
        $('dbg_unfold').hidden = true;
        $('dbg_fold').hidden = true;
        $('dbg_info').innerHTML = '';
    });

    $e($('dbg-export'), $v.debugger.export);
    $e($('dbg-import'), $v.debugger.import);

    $e($('ruleEdit_matchtype'), $v.ruleList.onChgMatchType.bind($v.ruleList));
    $e($('ruleEdit_matchContent'), function () {
        var t = $('ruleEdit_matchContentType');
        if (t.style.display !== 'block') {
            t.style.display = 'block';
            t.style.left = this.offsetLeft + 'px';
        }else{
            t.style.display = 'none';
        }
    });

    $e($('rmct1'), function () {
        var that = this;
        [].forEach.call(
            $$('#ruleEdit_matchContentType input'),
            function (i){
                i.checked = that.checked;
            }
        );
    });
    [].forEach.call($$('#rmcts'), function (rmct) {
        $e(rmct, function () {
            $$('#ruleEdit_matchContentType' + ' input')[0].checked = false;
        });
    });

    $e($('ruleEdit_subtype'), $v.ruleList.onChgSubType.bind($v.ruleList),
       'change');
    $e($('ruleEdit-save'), $v.ruleList.save.bind($v.ruleList));
    $e($('ruleEdit-discard'), $v.ruleList.discard.bind($v.ruleList));
    $e($('ruleEdit-test'), $v.ruleList.test.bind($v.ruleList));
    $e($('layerNotif'), function () {
        this.className = '';
    });
});
