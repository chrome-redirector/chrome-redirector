/**
 * Internationalization
 */

/*jslint nomen: false, undef: false */
/*global localStorage: true */

function Lang() {
    var re, flt, arr, a, b;
    try {
        this.data = JSON.parse(localStorage.LANG);
    } catch (e) {
        this.data = {langTag: navigator.language};
    }

    langTag = this.data.langTag;
    re = new RegExp('^' + langTag.split('-')[0] + '(-\\w+)?$');
    flt = function (obj) {
        return Object.keys(obj).filter(function (t) {
            return re.test(t)}).sort();
    };

    arr = ['i18nT', 'i18nP', 'notif'];
    for (var i = 0; i < arr.length; i++) {
        a = this[arr[i] + 'Set'];
        b = this[arr[i]] = a.FALLBACK;
        if (typeof a[langTag] !== 'undefined') {
            b.merge(a[langTag]);
        } else if ((tmp = flt(a)).length > 0) {
            b.merge(a[tmp[0]]);
        }
    }

    this.init('i18nT');
    this.init('i18nP');
}

Lang.prototype.init = function (type) {
    var elem, attr;

    elem = document.querySelectorAll('[' + type + ']');

    for (var i = 0; i < elem.length; i++) {
        try {
            attr = elem[i].getAttribute(type);
        } catch (e) {
            continue;
        }

        if (attr === null) continue;

        switch (type) {
        case 'i18nT':
            if ((typeof (tmp = this.i18nT[attr])) !== 'undefined') {
                elem[i].textContent = tmp;
            }
            break;
        case 'i18nP':
            attrArr = attr.split(":");

            if ((typeof (tmp = this.i18nP[attrArr[1]])) !==
                'undefined') {
                elem[i].setAttribute(attrArr[0], tmp);
            }
            break;
        default:
            console.log('Oops!');

        }
    }
};

Lang.prototype.refresh = function () {
    localStorage.LANG = JSON.stringify(this.data);
    window.location.reload();   // Reload options page
};

Lang.prototype.onSelLang = function (e) {
    switch (langSel.selectedIndex) {
    case 2:
        this.data.langTag='zh-CN'; break;
    default:
        this.data.langTag='en';
    }

    this.refresh();
};

Lang.prototype.i18nTSet = {
    'FALLBACK': {
        'PAGE-TITLE': 'Options',
        'NAVBAR-TITLE': 'Redirector Settings',
        'NAVBAR-PREF': 'Preferences',
        'NAVBAR-RULEMGR': 'Rules Manager',
        'NAVBAR-DOC': 'Help Documents',
        'PREF-TITLE': 'Preferences',
        'PROTO-TITLE': 'Enabled Protocols (restart required)',
        'PROTO-ALL': 'All supported protocols',
        'CONTEXT-TITLE': 'Manual Redirection',
        'CONTEXT-LINK': 'Enable context menu for Links',
        'CONTEXT-PAGE': 'Enable context menu for Pages',
        'MISC-TITLE': 'Misc',
        'DOC-TITLE': 'Documents',
        'RULEMGR-TITLE': 'Rules',
        'TAB-TITLE': 'Rules List',
        'RULEMGR-BAK-TITLE': 'Backup Rules List',
        'RULEEDIT-CURRENT': 'Current/New added Rule',
        'TYPE-REGEXP': 'RegExp',
        'TYPE-GLOB': 'Wildcards',
        'TYPE-MANUAL': 'Manual',
        'TYPE-BLOCK': 'Block',
        'LBL-NAME': 'Name',
        'LBL-MATCH': 'Match',
        'LBL-SUB': 'To be replaced',
        'LBL-REPL': 'Replace with',
        'LBL-TEST': 'Test URL',
        'LBL-IGNCASE': 'Ignore case',
        'LBL-SUBGLOB': 'Global match',
        'LBL-REPLDECODE': 'Decode URL'
    },

    'zh-CN': {
        'PAGE-TITLE': '选项',
        'NAVBAR-TITLE': 'Redirector设置',
        'NAVBAR-PREF': '首选项',
        'NAVBAR-RULEMGR': '规则管理',
        'NAVBAR-DOC': '帮助文档',
        'PREF-TITLE': '首选项',
        'PROTO-TITLE': '启用的协议(需重启)',
        'PROTO-ALL': '所有支持的协议',
        'CONTEXT-TITLE': '手动重定向',
        'CONTEXT-LINK': '链接右键菜单',
        'CONTEXT-PAGE': '页面右键菜单',
        'MISC-TITLE': '其它',
        'DOC-TITLE': '文档',
        'RULEMGR-TITLE': '规则',
        'TAB-TITLE': '规则列表',
        'RULEMGR-BAK-TITLE': '备份规则',
        'RULEEDIT-CURRENT': '当前／新添加的规则',
        'TYPE-REGEXP': '正则表达式',
        'TYPE-GLOB': '通配符',
        'TYPE-MANUAL': '手动',
        'TYPE-BLOCK': '屏蔽',
        'LBL-NAME': '名称',
        'LBL-MATCH': '匹配',
        'LBL-SUB': '被替换式',
        'LBL-REPL': '替换式',
        'LBL-TEST': '测试URL',
        'LBL-IGNCASE': '忽略大小写',
        'LBL-SUBGLOB': '多次替换',
        'LBL-REPLDECODE': '解码URL'
    }
};

Lang.prototype.i18nPSet = {
    'FALLBACK': {
        'BTN-SAVE': 'Save',
        'BTN-OK': 'OK',
        'BTN-CANCEL': 'Cancel',
        'BTN-ADD': 'Add',
        'BTN-DEL': 'Delete',
        'BTN-EDIT': 'Edit',
        'BTN-UP': 'Up',
        'BTN-DOWN': 'Down',
        'BTN-BAK': 'Backup',
        'BTN-RESTORE': 'Restore',
        'BTN-TEST': 'Test'
    },

    'zh-CN': {
        'BTN-SAVE': '保存',
        'BTN-CANCEL': '取消',
        'BTN-ADD': '添加',
        'BTN-DEL': '删除',
        'BTN-EDIT': '编辑',
        'BTN-UP': '上移',
        'BTN-DOWN': '下移',
        'BTN-BAK': '备份',
        'BTN-RESTORE': '还原',
        'BTN-TEST': '测试'
    }
};

Lang.prototype.notifSet = {
    'FALLBACK': {
        'EXP-ERR': 'Expression(s) may be incorrect, or I have a bug!',
        'MANUAL-BLOCK': 'URL cannot be blocked in manual redirection',
        'TEST-NOTMATCH': 'Test URL is not matched!',
        'TEST-BLOCK': 'Test URL will be blocked',
        'TEST-DEST': 'Redirect to: ',
        'RULE-BAK': 'Please copy and save the text in the textarea',
        'RULE-RESTORE-EMPTY': 'You didn\'t paste the text!',
        'RULE-RESTORE-ERR': 'Unable to restore!',
        'URL-INVALID-PROTO': 'URL has no valid protocol',
        'URL-INVALID-CHAR': 'URL contains invalid characters'
    },

    'zh-CN': {
        'EXP-ERR': '表达式有误或程序出错！',
        'MANUAL-BLOCK': '手动重定向不能屏蔽URL',
        'TEST-NOTMATCH': '测试URL不匹配！',
        'TEST-BLOCK': '测试URL将被屏蔽',
        'TEST-DEST': '重定向至：',
        'RULE-BAK': '请复制文本框中的文字保存以备用',
        'RULE-RESTORE-EMPTY': '请粘贴文本！',
        'RULE-RESTORE-ERR': '无法还原！',
        'URL-INVALID-PROTO': 'URL协议错误',
        'URL-INVALID-CHAR': 'URL包含有非法字符'
    }
};
