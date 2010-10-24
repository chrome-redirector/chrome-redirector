
// Initialization
function init() 
{
	// Some predefined values
	timeout = 3;
	inputNum = 6;
	tableColNum = 5;

	ruleListSel = 0;
	ruleList = new ruleList();
	manRedirList = new manRedirList();

	loadPref();

	// Some Listeners may required here
	navTags.addEventListener("click", switchNavTag, false);
	ruleListTable.addEventListener("click", ruleList.onSel, false);
	form.addEventListener("change", function(e) {ruleList.chg = true;}, false);
	chooseRule.addEventListener("change", selBuiltInRule, false);
	chooseLang.addEventListener("change", onSelLang, false);

	lang = new lang();
	i18nText.i18nInit(document, lang.i18nT);
	i18nProp.i18nInit(document, lang.i18nP);

	notif = lang.notif;
}

function loadPref() {
	try {
		pref = JSON.parse(localStorage.pref);
	} catch(e) {
		pref = [true, true];
	}

	for(var i in pref) {
		document.getElementById("pref" + i).checked = pref[i];
	}
}

function savePref(e) {
	for(var i in pref) {
		pref[i] = document.getElementById("pref" + i).checked;
	}

	localStorage.pref = JSON.stringify(pref);
	localStorage.selLang = selLang;
	sendUpdateMsg();
}

// Hide the input layer
function hideInput() {
	frontLayer.style.display="none";
	backLayer.style.display="none";
}

// Desktop Notification
function desktopNotif(arr, timeout) {
	var notif = webkitNotifications.createNotification("/icons/icon_48.png", arr[0], arr[1]);
	notif.show();
	setTimeout(function() {
		notif.cancel();
	}, timeout * 1000);
}

// Send update message
// SEEMS NOT WORK
function sendUpdateMsg() {
	var port = chrome.extension.connect({name: "update"});
	port.postMessage({hasUpdate: true});
}

// Navigation Bar
function switchNavTag(e)
{
	var tag = e.srcElement;
	navBar.getElementsByClassName("navTagSel")[0].className = "navTag";
	tag.className = "navTag navTagSel";

	main.getElementsByClassName("mainview-sel")[0].className = "mainview";
	if(tag.id == "preferencesTag") {
		preferences.className = "mainview-sel";
	} else {
		manageRules.className = "mainview-sel";
	}
}

// Select built-in rules
function selBuiltInRule(e)
{
	var sixxs = [
		"SixXS.org IPv6-to-IPv4 Proxy",
		"/\\.loooooogurl\\./",
		"/\\.sixxs\\.org/",
		"/(^(?:\\w+:\\/\\/)?[\\w\\.-]+)\\//",
		"$1.sixxs.org/",
		"http://www.loooooogurl.com/"
			]; 
	var zju6 = [
		"to4.zju6.edu.cn IPv6-to-IPv4 Proxy",
		"/\\.loooooogurl\\./", 
		"/\\.to4\\.zju6\\.edu\\.cn/",
		"/(^(?:\\w+:\\/\\/)?[\\w\\.-]+)\\//",
		"$1.to4.zju6.edu.cn/", 
		"http://www.loooooogurl.com/"
			];
	var gCacheText = [
		"Access Google Cache Text-only Version",
		"/webcache\\.google.*/",
		"/&strip=1$/", 
		"/$/",
		"&strip=1",
		"http://webcache.googleusercontent.com/"
			];

	// Todo: https, link decode, etc.
	switch(chooseRule.selectedIndex) {
	case 1:
		var rule = sixxs;
		break;
	case 2:
		var rule = zju6;
		break;
	case 3:
		var rule = gCacheText;
		break;
	default:
		ruleList.update(ruleListSel);
		return;
	}

	for(var i = 0; i < inputNum; i++) {
		document.getElementById('input' + i).value = rule[i];
	}
}


// (Auto Redirect) Rules List Object
function ruleList() {
	/**
	 * Array "ruleList.data" contains several other arrays called "rules". The 
	 * first rule is an empty rule, so the actual rules start from Index 1.
	 *
	 * Meanings of each element in a rule are shown in the table below:
	 *
	 * 	Index	Meaning							Column in table
	 * 	0		name of the rule				Rule Name
	 * 	1		whether a url matches			Whitelist
	 * 	2		whether a url does'nt match		Blacklist
	 * 	3		1st parameter of str.replace()	RegExp/SubStr
	 * 	4		2nd parameter of str.replace()	Replacement
	 * 	5		a url for testing				N/A
	 * 	6		whether rule is enabled			N/A
	 */
	try {
		this.data = JSON.parse(localStorage.ruleList);
	} catch(e) {
		this.data = [["Untitled", "", "", "", "", "", false]];
	}

	// Restore rules table
	for(var i = 1; i < this.getLen(); i++) {
		ruleListTable.insertRow(-1).innerHTML = "<td></td><td></td><td></td><td></td><td></td>";
		this.update(i);
	}

    this.chg = false;
    this.isNew = false;
}

ruleList.prototype.add = function() {
	// need simplification
	this.data.push(["Untitled", "", "", "", "", "", true]);
	ruleListSel = this.getLen() - 1;

	ruleListTable.insertRow(-1).innerHTML = "<td></td><td></td><td></td><td></td><td></td>";
	this.update(ruleListSel);

	this.isNew = true;
	this.edit();
}

ruleList.prototype.del = function() {
	if(ruleListSel == 0) {
		return;
	}

	ruleList.data.splice(ruleListSel, 1);
	localStorage.ruleList = JSON.stringify(ruleList.data);
	ruleListTable.deleteRow(ruleListSel);

	ruleListSel = 0;
	sendUpdateMsg();
}

ruleList.prototype.edit = function() {
	if(ruleListSel == 0) {
		return;
	}

	this.update();

	backLayer.style.display="block";
	frontLayer.style.display="block";
	scroll(0,0);
}

ruleList.prototype.update = function(ruleIndex) {
	try {
		var cells = ruleListTable.getElementsByTagName("tr")[ruleIndex].children;

		for(var i = 0; i < tableColNum; i++) {
			cells[i].innerText = this.getRule(ruleIndex)[i];
		}

		for(var i = 0; i < inputNum; i++) {
			document.getElementById('input' + i).value = this.getRule(ruleIndex)[i];
		}
	} catch(e) {
		this.update(ruleListSel);
	}
}

ruleList.prototype.save = function() {
	try {
		var ruleName = input0.value;
		var whitelist = eval(input1.value);
		var blacklist = eval(input2.value);
		var subStr = eval(input3.value);
		var repl = input4.value;
		var testUrl = input5.value;
	} catch(e) {
		desktopNotif(notif.illegal_re, timeout);
		return;
	}

	if(typeof(whitelist) == 'undefined' || typeof(blacklist) == 'undefined' ||
		typeof(subStr) == 'undefined' || ruleName == '' || repl == '' || testUrl == '') {
		desktopNotif(notif.value_blank, timeout);
		return;
	}

	if(whitelist.test(testUrl) && !blacklist.test(testUrl)) {
		var redirUrl = testUrl.replace(subStr, repl);
		if(whitelist.test(redirUrl) && !blacklist.test(redirUrl)) {
			desktopNotif(notif.endless_loop, timeout);
			return;
		}
	} else {
		desktopNotif(notif.not_matched, timeout);
		return;
	}

	for(var i = 0; i < inputNum; i++) {
		this.data[ruleListSel][i] = document.getElementById("input" + i).value;
	}

	localStorage.ruleList = JSON.stringify(this.data);
	hideInput();
	this.update(ruleListSel);
	this.chg = false;
	this.isNew = false;
	sendUpdateMsg();
}

ruleList.prototype.restore = function() {
	if(this.chg) {
		if(!confirm(notif.confirm_discard)) {
			return;
		}
	}

	if(this.isNew) {
		this.del();
		this.isNew = false;
	}

	hideInput();
	this.chg = false;
}

ruleList.prototype.getLen = function() {
	return this.data.length;
}

ruleList.prototype.getRule = function(ruleIndex) {
	try {
		return this.data[ruleIndex];
	} catch(e) {
		return this.data[ruleListSel];
	}
}

ruleList.prototype.onSel = function(e) {
	// Get selected row (<tr>)
	if(e instanceof Object) {
		var elem = e.srcElement;
		while(!/^tr$/i.test(elem.tagName)) {
			if(/^th$/i.test(elem.tagName) || /^body$/i.test(elem.tagName)) {
				return;
			}
			elem = elem.parentElement;
		}
		ruleListSel = elem.rowIndex;
	} else {
		var elem = ruleListTable.getElementsByTagName('tr')[ruleListSel];
	}

	// Decolor all cells
	var tds = ruleListTable.getElementsByClassName("sel-td");
	while(tds.length > 0) {
		tds[0].className = "";
	}

	// Color the selected cell
	for(var i = 0; i < tableColNum; i++) {
		elem.cells[i].className = "sel-td";
	}
}

ruleList.prototype.moveUp = function() {
	if(ruleListSel == 1) {
		return;
	}

	var incre = -1;
	var tmpRule = this.getRule(ruleListSel);
	this.data[ruleListSel] = this.data[ruleListSel + incre];
	ruleListSel += incre;
	this.data[ruleListSel] = tmpRule;

	this.update(ruleListSel);
	this.update(ruleListSel - incre);

	this.onSel();

	localStorage.ruleList = JSON.stringify(this.data);
}

ruleList.prototype.moveDown = function() {
	if(ruleListSel == this.getLen() - 1) {
		return;
	}

	var incre = 1;
	var tmpRule = this.getRule(ruleListSel);
	this.data[ruleListSel] = this.data[ruleListSel + incre];
	ruleListSel += incre;
	this.data[ruleListSel] = tmpRule;

	this.update(ruleListSel);
	this.update(ruleListSel - incre);

	this.onSel();

	localStorage.ruleList = JSON.stringify(this.data);
}


// Manual Redirect (Rules) List Object
function manRedirList() {
	this.update();
}

manRedirList.prototype.add = function() {
	var ruleName = ruleList.getRule(ruleListSel)[0];
	if(this.data.indexOf(ruleName) == -1) { 
		this.data.push(ruleName);
	}

	localStorage.manRedirList = JSON.stringify(this.data);
	this.update();
}

manRedirList.prototype.del = function() {
	var index = this.data.indexOf(manRedirSel.value);
	this.data.splice(index, 1);

	localStorage.manRedirList = JSON.stringify(this.data);
	this.update();
}

manRedirList.prototype.update = function() {
	try {
		this.data = JSON.parse(localStorage.manRedirList);
	} catch(e) {
		this.data = [];
	}

	while(manRedirSel.length > 0) {
		manRedirSel.options.remove(i);
	}

	manRedirSel.size = this.getLen();

	for(var i in this.data) {
		manRedirSel.options.add(new Option(this.data[i]));
	}
}

manRedirList.prototype.getLen = function() {
	return this.data.length;
}

// Internationalization 
var i18nText = (function() {
	function i18nInit(node, obj) {
		var elems = node.querySelectorAll("[i18nT]");
		for (var elem , i = 0; elem = elems[i]; i++) {
			var attrib = elem.getAttribute("i18nT");
			if (attrib != null) {
				elem.textContent = obj[attrib];
			}
		}
	}
 
	return {
		i18nInit: i18nInit 
	};
})();

var i18nProp = (function() {
	function i18nInit(node, obj) {
		var elems = node.querySelectorAll("[i18nP]");
		for (var elem , i = 0; elem = elems[i]; i++) {
			var attrib = elem.getAttribute("i18nP");
			if (attrib != null) {
				attribArr = attrib.split(":");
				elem.setAttribute(attribArr[0], obj[attribArr[1]]);
			}
		}
	}
 
	return {
		i18nInit: i18nInit 
	};
})();

function onSelLang(e) {
	selLang = chooseLang.selectedIndex;
}
