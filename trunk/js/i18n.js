/* Internationalization.

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
/*global $: true, $$: true, $v: true, $f: true*/
/*global localStorage: true, Lang: true*/

Lang = function () {            // Obj holds language data/methods
    try {
        this.data = JSON.parse(localStorage.LANG);
    } catch (e) {               // Default to browser's locale
        this.data = {langTag: navigator.language.replace('-', '_')};
    }

    this.loadI18n();            // Load the i18n data
    this.apply('i18nT');        // Translate HTML texts
    this.apply('i18nP');        // Translate HTML properties
};

Lang.prototype.apply = function (type) { // Apply i18n data to HTML
    var elem = $$('[' + type + ']'); // All elements need to be mod

    for (var i = 0; i < elem.length; i++) {
        var it = elem[i];

        try {
            var attr = it.getAttribute(type);
        } catch (e) {
            continue;
        }

        if (attr === null) {
            continue;
        }
        // Are chks above redundant?

        switch (type) {
        case 'i18nT':           // Translate text
            if (this.i18n.hasOwnProperty(attr)) {
                it.textContent = this.i18n[attr];
            } else {            // I18n file broken
                $f.dbg('Oops!');
            }
            break;
        case 'i18nP':           // Translate properties
            var attrArr = attr.split(":"); // Fmt of attr: prop:val

            if (this.i18n.hasOwnProperty(attrArr[1])) {
                it.setAttribute(attrArr[0], this.i18n[attrArr[1]]);
            } else {            // I18n file broken
                $f.dbg('Oops!');
            }
            break;
        }
    }
};

Lang.prototype.refresh = function () { // Refresh languages data
    localStorage.LANG = JSON.stringify(this.data);
    location.reload();          // Reload options page
};

Lang.prototype.onSelLang = function (e) { // Language selector handler
    var tmp;
    if ((tmp = $('langSel').selectedIndex - 1) === -1) { // From 2nd
        return;
    }

    if (this.data.langTag !== this.avail[tmp]) { // Language changed
        this.data.langTag = this.avail[tmp];
        this.refresh();
    }
};

Lang.prototype.loadI18n = function () { // Load the i18n data
    var i18nSet = {};

    var langList = $f.xhrJson('/_locales/lang.json'); // Avail languages

    for (var i in langList) {
        if (langList.hasOwnProperty(i)) {
            try {                   // Determine if a locale available
                i18nSet[i] =
                    $f.xhrJson('/_locales/' + i + '/messages.json');
            } catch (e) {
                delete i18nSet[i];  // Delete empty entry
            }
        }
    }

    try {                       // It's pointless and to fail in bg
        this.avail = Object.keys(i18nSet).sort(); // Avail langs
        // Append options to the language selector
        for (var i = 0; i < this.avail.length; i++) {
            var tmp = document.createElement('option');
            tmp.text = langList[this.avail[i]];
            $('langSel').add(tmp, null);
        }
    } catch (e) {}

    var a = i18nSet;            // Shortcuts
    var b = this.i18n = a.en_US; // en_US is the fallback locale
    if (a.hasOwnProperty(this.data.langTag)) { // User locale avail
        b.merge(a[this.data.langTag]);
    } else {                    // Find a suitable locale
        // RegExp to test if a locale belong to the same language
        var re = new RegExp('^' + this.data.langTag.split('_')[0] +
                        '(_\\w+)?$');
        // Obj filter: e.g. zh_HK will select only [zh:, zh_CN:, ...]
        var flt = function (obj) {
            return Object.keys(obj).filter(function (t) {
                return re.test(t);
            }).sort();
        };

        if ((tmp = flt(a)).length > 0) { // A suitable locale found
            b.merge(a[tmp[0]]);          // Choose the 1st locale
        }
    }

    for (var i in this.i18n) {  // Change CWS fmt to my own
        if (! this.i18n.hasOwnProperty(i)) {
            continue;
        }

        this.i18n[i] = this.i18n[i].message;
    }
};
