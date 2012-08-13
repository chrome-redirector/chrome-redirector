var i18nT_en = {
    "navbar-title": "Redirector Settings",
    "navbar-pref": "Preferences",
    "navbar-mngrule": "Manage Rules",
    "h1-pref": "Preferences",
    "h3-lang": "Language",
    "h3-amredir": "Auto/Manual Redirect",
    "pref-autoredir": "Enable automatically redirect",
    "pref-manredir": "Enable manually redirect",
    "h1-mngrule": "Manage Rules",
    "h3-rulelist": "Rule List",
    "table-name": "Rule Name",
    "table-white": "Whitelist",
    "table-black": "Blacklist",
    "table-substr": "RegExp/SubStr",
    "table-repl": "Replacement",
    "h3-manredir": "Manual Redirect",
    "op-edit": "Current Rule",
    "op-http2https": "Visit URLs begin with http://code.google.com \
using https://",
    "op-appques": "Append '?' to all URLs begin with http:// \
(You probably don't need it)",
    "op-googlecache": "Access Google cache text-only version \
directly",
    "op-sixxs": "SixXS.org IPv6-to-IPv4 proxy \
(Modify the whitelist to apply to certain sites)",
    "lb-name": "Rule Name",
    "lb-white": "Whitelist",
    "lb-black": "Blacklist",
    "lb-substr": "RegExp/SubStr",
    "lb-repl": "Replacement",
    "lb-testurl": "Test URL",
};

var i18nP_en = {
    "pref-savebttn": "Save",
    "pref-cancelbttn": "Restore",
    "bttns-add": "Add",
    "bttns-edit": "Edit",
    "bttns-del": "Delete",
    "bttns-up": "Up",
    "bttns-down": "Down",
    "bttns-addToManList": "Add to Manual List",
    "manredir-rm": "Remove form Manual List",
    "edit-save": "Save",
    "edit-discard": "Discard",
};

var i18nT_zhCN = {
    "navbar-title": "Redirector 设置",
    "navbar-pref": "首选项",
    "navbar-mngrule": "管理规则",
    "h1-pref": "首选项",
    "pref-autoredir": "自动重定向",
    "pref-manredir": "手动重定向",
    "h1-mngrule": "管理规则",
    "h3-lang": "语言",
    "h3-amredir": "自动/手动重定向",
    "h3-rulelist": "规则列表",
    "table-name": "规则名称",
    "table-white": "白名单",
    "table-black": "黑名单",
    "table-substr": "匹配子串",
    "table-repl": "替换式",
    "h3-manredir": "手动重定向",
    "op-edit": "当前条目",
    "op-http2https": "将http://code.google.com重定向到https://",
    "op-appques": "在URL后添加'?'号（如果不是有需求，勿用）",
    "op-googlecache": "跳过完整版直接使用Google网页快照的纯文字版",
    "op-sixxs": "在域名后添加sixxs.org（需要修改白名单以便针对特定地址）",
    "lb-name": "规则名称",
    "lb-white": "白名单",
    "lb-black": "黑名单",
    "lb-substr": "子串",
    "lb-repl": "替换式",
    "lb-testurl": "测试URL",
};

var i18nP_zhCN = {
    "pref-savebttn": "保存",
    "pref-cancelbttn": "重置",
    "bttns-add": "添加",
    "bttns-edit": "编辑",
    "bttns-del": "删除",
    "bttns-up": "上移",
    "bttns-down": "下移",
    "bttns-addToManList": "添加到手动列表",
    "manredir-rm": "从列表中删除",
    "edit-save": "保存",
    "edit-discard": "取消",
}

notif_en = {
    "pref_saved": ["Notice", "Preferences saved!"],
    "illegal_re": ["Error", "Illegal Regular Expression!"],
    "value_blank": ["Error", "Value should not be blank!"],
    "endless_loop": ["Error", "Endless loop!"],
    "not_matched": ["Error", "Not matched!"],
    "confirm_discard": "Changes are not saved, discard anyway?",
};

notif_zhCN = {
    "pref_saved": ["提醒", "设置已保存！"],
    "illegal_re": ["错误", "非法的正则表达式！"],
    "value_blank": ["错误", "输入不能为空！"],
    "endless_loop": ["错误", "死循环！"],
    "not_matched": ["错误", "规则不匹配！"],
    "confirm_discard": "改动未保存，确认取消？",
};

function lang() {
    var langTag;
    selLang = localStorage.selLang;
    if(!(selLang === undefined)) {
        chooseLang.selectedIndex = eval(selLang);
        switch(selLang) {
        case "1":
            langTag = "zh-CN";
            break;
        default:
            langTag = "en";
        }
    } else {
        langTag = navigator.language;
    }

    switch(langTag){
    case "zh-CN":
        this.i18nT = i18nT_zhCN;
        this.i18nP = i18nP_zhCN;
        this.notif = notif_zhCN;
        break;
    default:
        this.i18nT = i18nT_en;
        this.i18nP = i18nP_en;
        this.notif = notif_en;
    }
}
