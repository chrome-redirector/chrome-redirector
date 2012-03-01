/**
 * Internationalization
 */

/*jslint plusplus: false */
/*global $: true, $$: true,
  document: true, window: true, navigator: true,
  tmp: true,
  localStorage: true, xhrJson: true */

function Lang() {               // Obj holds language data/methods
    try {
        this.data = JSON.parse(localStorage.LANG);
    } catch (e) {               // Default to browser's locale
        this.data = {langTag: navigator.language.replace('-', '_')};
    }

    this.loadI18n();            // Load the i18n data
    this.apply('i18nT');        // Translate HTML texts
    this.apply('i18nP');        // Translate HTML properties
}

Lang.prototype.apply = function (type) { // Apply i18n data to HTML
    var elem, it, attr, attrArr;

    elem = $$('[' + type + ']'); // All elements need to be modified

    for (var i = 0; i < elem.length; i++) {
        it = elem[i];

        try {
            attr = it.getAttribute(type);
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
                DBG('Oops!');
            }
            break;
        case 'i18nP':           // Translate properties
            attrArr = attr.split(":"); // Fmt of attr: prop:val

            if (this.i18n.hasOwnProperty(attrArr[1])) {
                it.setAttribute(attrArr[0], this.i18n[attrArr[1]]);
            } else {            // I18n file broken
                DBG('Oops!');
            }
            break;
        }
    }
};

Lang.prototype.refresh = function () { // Refresh languages data
    localStorage.LANG = JSON.stringify(this.data);
    window.location.reload();   // Reload options page
};

Lang.prototype.onSelLang = function (e) { // Language selector handler
    if ((tmp = $('langSel').selectedIndex - 1) === -1) { // From 2nd
        return;
    }

    if (this.data.langTag !== this.avail[tmp]) { // Language changed
        this.data.langTag = this.avail[tmp];
        this.refresh();
    }
};

Lang.prototype.loadI18n = function () { // Load the i18n data
    var langList, i18nSet = {}, a, b, re, flt;

    langList = xhrJson('/_locales/lang.json'); // Available languages

    for (var i in langList) {
        if (! langList.hasOwnProperty(i)) {
            continue;
        }

        try {                   // Determine if a locale available
            i18nSet[i] = xhrJson('/_locales/' + i + '/messages.json');
        } catch (e) {
            delete i18nSet[i];  // Delete empty entry
        }
    }

    try {                       // It's pointless and to fail in bg
        this.avail = Object.keys(i18nSet).sort(); // Avail langs
        // Append options to the language selector
        for (var i = 0; i < this.avail.length; i++) {
            tmp = document.createElement('option');
            tmp.text = langList[this.avail[i]];
            $('langSel').add(tmp, null);
        }
    } catch (e) {}

    a = i18nSet;                // Shortcuts
    b = this.i18n = a.en_US;    // en_US is the fallback locale
    if (a.hasOwnProperty(this.data.langTag)) { // User locale avail
        b.merge(a[this.data.langTag]);
    } else {                    // Find a suitable locale
        // RegExp to test if a locale belong to the same language
        re = new RegExp('^' + this.data.langTag.split('_')[0] +
                        '(_\\w+)?$');
        // Array filter: e.g. zh_HK will select only [zh, zh_CN...]
        flt = function (obj) {
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
