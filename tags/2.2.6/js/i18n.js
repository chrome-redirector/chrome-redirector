/**
 * Internationalization
 */

/*jslint plusplus: false */
/*global document: true, window: true, navigator: true, console: true,
  tmp: true, localStorage: true,
  xhrJson: true */

function Lang() {
    var re, flt, arr, a, b;
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
    var elem, attr, attrArr;

    elem = document.querySelectorAll('[' + type + ']');

    for (var i = 0; i < elem.length; i++) {
        try {
            attr = elem[i].getAttribute(type);
        } catch (e) {
            continue;
        }

        if (attr === null) {
            continue;
        }

        switch (type) {
        case 'i18nT':
            if (this.i18n.hasOwnProperty(attr)) {
                elem[i].textContent = this.i18n[attr];
            }
            break;
        case 'i18nP':
            attrArr = attr.split(":");

            if (this.i18n.hasOwnProperty(attrArr[1])) {
                elem[i].setAttribute(attrArr[0],
                                     this.i18n[attrArr[1]]);
            }
            break;
        default:
            console.log('Oops!');

        }
    }
};

Lang.prototype.refresh = function () { // Refresh languages data
    localStorage.LANG = JSON.stringify(this.data);
    window.location.reload();   // Reload options page
};

Lang.prototype.onSelLang = function (e) { // Language selector handler
    if ((tmp =
         document.getElementById('langSel').selectedIndex - 1) ===
        -1) {
        return;
    }

    if (this.data.langTag !== this.avail[tmp]) {
        this.data.langTag = this.avail[tmp];
        this.refresh();
    }
};

Lang.prototype.loadI18n = function () { // Load the i18n data
    var langList, i18nSet = {};

    langList = xhrJson('/i18n/lang.json');

    for (var i in langList) {
        if (! langList.hasOwnProperty(i)) {
            continue;
        }

        try {
            i18nSet[i] = xhrJson('/i18n/' + i + '.json');
        } catch (e) {
            delete i18nSet[i];
        }
    }

    try {                       // It'll fail in background page
        this.avail = Object.keys(i18nSet).sort(); // Avail langs
        // Append options to the language selector
        for (var i = 0; i < this.avail.length; i++) {
            tmp = document.createElement('option');
            tmp.text = langList[this.avail[i]];
            document.getElementById('langSel').add(tmp, null);
        }
    } catch (e) {}

    a = i18nSet;
    b = this.i18n = a.en_US;    // en_US is the fallback locale
    if (a.hasOwnProperty(this.data.langTag)) {
        b.merge(a[this.data.langTag]);
    } else {
        // Construct an array filter
        re = new RegExp('^' + this.data.langTag.split('_')[0] +
                        '(_\\w+)?$');
        flt = function (obj) {
            return Object.keys(obj).filter(function (t) {
                return re.test(t);
            }).sort();
        };

        if ((tmp = flt(a)).length > 0) {
            b.merge(a[tmp[0]]);
        }
    }
};
