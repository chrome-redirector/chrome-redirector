/**
 * Internationalization
 */

function Lang() {
    try {
        this.data = JSON.parse(localStorage.LANG);
    } catch (e) {
        this.data = {langTag: navigator.language};
    }

    switch (this.data.langTag){
    case "zh-CN":
        Object.merge(i18nT, i18nT_zhCN);
        Object.merge(i18nP, i18nP_zhCN);
        Object.merge(notif, notif_zhCN);
        break;
    default:
        ;
    }

    this.i18nT = i18nT;
    this.i18nP = i18nP;
    this.notif = notif;
    this.init();
}

Lang.prototype.init = function(type) {
    if (type == null) {
        this.init('i18nT');
        this.init('i18nP');

        return;
    }

    var elem = document.querySelectorAll('[' + type + ']');

    for (var i in elem) {
        try {
            var attrib = elem[i].getAttribute(type);
        } catch (e) {
            continue;
        }

        if (attrib == null) continue;

        switch (type) {
        case 'i18nT':
            if ((typeof (tmp = this.i18nT[attrib])) != 'undefined')
                elem[i].textContent = tmp;
            break;
        case 'i18nP':
            attribArr = attrib.split(":");

            if ((typeof (tmp = this.i18nP[attribArr[1]])) !=
                'undefined')
                elem[i].setAttribute(attribArr[0], tmp);
            break;
        default:
            console.log('Oops!');

        }
    }
}

Lang.prototype.refresh = function() {
    localStorage.LANG = JSON.stringify(this.data);
    window.location.reload();   // Reload options page
}

Lang.prototype.onSelLang = function(e) {
    switch(langSel.selectedIndex) {
    case 2:
        this.data.langTag='zh-CN'; break;
    default:
        this.data.langTag='en';
    }

    this.refresh();
}

// Fallback and default settings
var i18nT = {
    'PAGE-TITLE': 'Options',

    'NAVBAR-TITLE': 'Redirector Settings',
    'NAVBAR-PREF': 'Preferences',
    'NAVBAR-RULEMGR': 'Rules Manager',
    'NAVBAR-DOC': 'Help Documents',

    'PREF-TITLE': 'Preferences',

    'PREF-PROTO': 'Enabled Protocols (restart required)',
    'PREF-PROTO-ALL': 'All supported protocols',

    'PREF-MISC': 'Misc',
    'PREF-MISC-ICON': 'Hide icon (disable manual redirection)',

    'DOC-TITLE': 'Documents',

    'RULEMGR-TITLE': 'Rules',

    'RULEMGR-TAB-TITLE': 'Rules List',
    'RULEMGR-TAB-NAME': 'Name',
    'RULEMGR-TAB-MATCH': 'Match',
    'RULEMGR-TAB-SUB': 'Sub',
    'RULEMGR-TAB-REPL': 'Replacement',
    'RULEMGR-BAK-TITLE': 'Backup Rules List',

    'RULEEDIT-CURRENT': 'Current/New added Rule',

    'RULEEDIT-TYPE-REGEXP': 'RegExp',
    'RULEEDIT-TYPE-GLOB': 'Wildcards',
    'RULEEDIT-TYPE-MANUAL': 'Manual',
    'RULEEDIT-TYPE-BLOCK': 'Block',

    'RULEEDIT-LAB-NAME': 'Name',
    'RULEEDIT-LAB-MATCH': 'Match',
    'RULEEDIT-LAB-SUB': 'Sub',
    'RULEEDIT-LAB-REPL': 'Replacement',
    'RULEEDIT-LAB-TEST': 'Test URL',
    'RULEDIT-LAB-IGNCASE': 'Ignore case',
    'RULEDIT-LAB-SUBGLOB': 'Global match',
    'RULEDIT-LAB-REPLDECODE': 'Decode afer replace',
};

var i18nP = {
    'PREF-SAVE': 'Save',
    'PREF-CANCEL': 'Cancel',

    'RULEMGR-BTN-ADD': 'Add',
    'RULEMGR-BTN-EDIT': 'Edit',
    'RULEMGR-BTN-DEL': 'Delete',
    'RULEMGR-BTN-UP': 'Up',
    'RULEMGR-BTN-DOWN': 'Down',
    'RULEMGR-BAK': 'Backup',
    'RULEMGR-RESTORE': 'Restore',

    'RULEEDIT-SAVE': 'Save',
    'RULEEDIT-DISCARD': 'Discard',
    'RULEEDIT-TEST': 'Test',
};

var notif = {
    'PREF-SAVED': 'Preferences saved!',
    'CONFIRM-DISCARD': 'Do you really want to discard?',
    'EXP-ERR': 'Expression(s) may be incorrect, or I have a bug!',
    'MULTI-MANUAL': 'Mutiple enabled manual rules (Only the 1st one \
will be used)!',
    'MANUAL-BLOCK': 'URL cannot be blocked in manual redirection',
    'TEST-NOTMATCH': 'Test URL is not matched!',
    'TEST-BLOCK': 'Test URL will be blocked',
    'TEST-DEST': 'Redirect to: ',
    'RULE-BAK': 'Please copy the text in the textarea for later use',
    'RULE-RESTORE-EMPTY': "You didn't paste the text!",
    'RULE-RESTORE-ERR': "An error occurred! Please check the text",
}

/**
 * 简体中文 (Simplified Chinese)
 */
var i18nT_zhCN = {
    'PAGE-TITLE': '选项',

    'NAVBAR-TITLE': 'Redirector 设置',
    'NAVBAR-PREF': '首选项',
    'NAVBAR-RULEMGR': '规则管理',
    'NAVBAR-DOC': '帮助文档',

    'PREF-TITLE': '首选项',
    'PREF-PROTO': '更改启用的协议(需重启)',
    'PREF-PROTO-ALL': '所有支持的协议',

    'PREF-MISC': '其它',
    'PREF-MISC-ICON': '隐藏图标（禁用手动重定向）',

    'DOC-TITLE': '文档',

    'RULEMGR-TITLE': '规则',

    'RULEMGR-TAB-TITLE': '规则列表',
    'RULEMGR-TAB-NAME': '名称',
    'RULEMGR-TAB-MATCH': '匹配',
    'RULEMGR-TAB-SUB': '被替换式',
    'RULEMGR-TAB-REPL': '替换字符串',
    'RULEMGR-BAK-TITLE': '备份规则',

    'RULEEDIT-CURRENT': '当前／新添加的规则',

    'RULEEDIT-TYPE-REGEXP': '正则表达式',
    'RULEEDIT-TYPE-GLOB': '通配符',
    'RULEEDIT-TYPE-MANUAL': '手动',
    'RULEEDIT-TYPE-BLOCK': '阻塞',

    'RULEEDIT-LAB-NAME': '名称',
    'RULEEDIT-LAB-MATCH': '匹配',
    'RULEEDIT-LAB-SUB': '被替换式',
    'RULEEDIT-LAB-REPL': '替换字符串',
    'RULEEDIT-LAB-TEST': '测试URL',
    'RULEDIT-LAB-IGNCASE': '忽略大小写',
    'RULEDIT-LAB-SUBGLOB': '全局匹配',
    'RULEDIT-LAB-REPLDECODE': '替换后解码',
};

var i18nP_zhCN = {
    'PREF-SAVE': '保存',
    'PREF-CANCEL': '取消',

    'RULEMGR-BTN-ADD': '添加',
    'RULEMGR-BTN-EDIT': '编辑',
    'RULEMGR-BTN-DEL': '删除',
    'RULEMGR-BTN-UP': '上移',
    'RULEMGR-BTN-DOWN': '下移',
    'RULEMGR-BAK': '备份',
    'RULEMGR-RESTORE': '还原',

    'RULEEDIT-SAVE': '保存',
    'RULEEDIT-DISCARD': '放弃',
    'RULEEDIT-TEST': '测试',
};

var notif_zhCN = {
    'PREF-SAVED': '首选项已保存！',
    'CONFIRM-DISCARD': '确定放弃修改？',
    'EXP-ERR': '表达式有误或程序出错！',
    'MULTI-MANUAL': '多条手动规则被启用（仅第一条有效）!',
    'MANUAL-BLOCK': '手动重定向不能阻塞URL',
    'TEST-NOTMATCH': '测试URL不能匹配！',
    'TEST-BLOCK': '测试URL将被阻塞',
    'TEST-DEST': '重定向至：',
    'RULE-BAK': '请复制文本框中的文字保存以备用',
    'RULE-RESTORE-EMPTY': "请粘贴文本！",
    'RULE-RESTORE-ERR': "无法还原！请检查文本",
}