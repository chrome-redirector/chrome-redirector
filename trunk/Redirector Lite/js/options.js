
// Initialization
function init() 
{
	// Clear saved data (for devel only)
	//localStorage.clear();

	// Some predefined values
	timeout = 3;
	inputNum = 6;
	tableColNum = 5;
	selRuleIndex = 0;
	ifChgSaved = true;
	isNewRule = false;
	emptyRow = "<td></td><td></td><td></td><td></td><td></td>";

	// Restore saved data
	/**
	 * Array "ruleData" contains several other arrays which call "rules". The 
	 * first rule is an empty rule, so the actual rules start from Index 1.
	 *
	 * Meanings of each element in a rule are shown in the table below:
	 *
	 * 	Index	Meaning							Column in table
	 * 	0		name of the rule				Rule Name
	 * 	1		whether a url matches			Match Pattern
	 * 	2		whether a url does'nt match		Blacklist
	 * 	3		1st parameter of str.replace()	RegExp/SubStr
	 * 	4		2nd parameter of str.replace()	Replacement
	 * 	5		a url for testing				N/A
	 */
	try {
		ruleData = JSON.parse(localStorage.ruleData);
	} catch(e) {
		ruleData = [];
		ruleData[0] = ["", "", "", "", "", ""];
	}

	// Restore rules table
	for(var i = 1; i < ruleData.length; i++) {
		table.insertRow(-1).innerHTML = emptyRow;
		updateRow(i);
	}

	// Some Listeners may required here
	navTags.addEventListener("click", switchNavTag, false);
	table.addEventListener("click", selRule, false);
	form.addEventListener("change", function(e) {ifChgSaved = false;}, false);
}

// Save data locally
function saveData() 
{
	try {
		ruleName = input0.value;
		matchPat = eval(input1.value);
		blacklist = eval(input2.value);
		subStr = eval(input3.value);
		repl = input4.value;
		testUrl = input5.value;
	} catch(e) {
		alert("Illegal RegExp!");
		return;
	}

	if(typeof(matchPat) == 'undefined' || typeof(blacklist) == 'undefined' ||
		typeof(subStr) == 'undefined' || ruleName == '' || repl == '' || testUrl == '') {
		desktopNotif("Error", "Value should not be blank", timeout);
		return;
	}

	if(matchPat.test(testUrl) && !blacklist.test(testUrl)) {
		redirUrl = testUrl.replace(subStr, repl);
		if(matchPat.test(redirUrl) && !blacklist.test(redirUrl)) {
			// IMPROVMENT NEEDED
			desktopNotif("Error", "Endless loop!", timeout);
			return;
		}
	} else {
		// IMPROVMENT NEEDED
		desktopNotif("Error", "Not matched!", timeout);
		return;
	}

	for(var i = 0; i < inputNum; i++) {
		ruleData[selRuleIndex][i] = document.getElementById("input" + i).value;
	}

	localStorage.ruleData = JSON.stringify(ruleData);
	hideInput();
	updateRow(selRuleIndex);
	ifChgSaved = true;
	isNewRule = false;
	sendUpdateMsg();
}

// Update table
function updateRow(ruleIndex) 
{
	if(arguments.length == 0) {
		updateRow(0);
		return;
	}

	var row = table.getElementsByTagName("tr")[ruleIndex].children;
	for(var i = 0; i < tableColNum; i++) {
		row[i].innerText = ruleData[ruleIndex][i];
	}
}

// Update inputs
function updateInput(ruleIndex)
{
	if(arguments.length == 0) {
		updateInput(0);
		return;
	}

	try {
		for(var i = 0; i < inputNum; i++) {
			document.getElementById('input' + i).value = ruleData[ruleIndex][i];
		}
	} catch(e) {
		for(var i = 0; i < inputNum; i++) {
			updateInput(0);
		}
	}
}

// Add a rule
function addRule() 
{
	ruleData.push(["Untitled", "", "", "", "", ""]);
	selRuleIndex = ruleData.length - 1;

	table.insertRow(-1).innerHTML = emptyRow;
	updateRow(selRuleIndex);
	selRule();

	isNewRule = true;
	editRule();
}

// Edit a rule
function editRule()
{
	updateInput(selRuleIndex);

	backLayer.style.display="block";
	frontLayer.style.display="block";
	scroll(0,0);
}

// Discard changes
function discardChg()
{
	if(!ifChgSaved) {
		if(!confirm("Changes are not saved, discard?")) {
			return;
		}
	}

	if(isNewRule) {
		ruleData.pop();
		table.deleteRow(selRuleIndex);
		selRuleIndex = 0;
		isNewRule = false;
	}

	hideInput();
	ifChgSaved = true;
}

// Move a row
function sortRule(signal)
{
	if(signal == "up") {
		var incre = -1;
	} else {
		var incre = 1;
	}

	var tmpRule = ruleData[selRuleIndex];
	ruleData[selRuleIndex] = ruleData[selRuleIndex + incre];
	selRuleIndex += incre;
	ruleData[selRuleIndex] = tmpRule;

	updateRow(selRuleIndex);
	updateRow(selRuleIndex - incre);

	selRule();

	localStorage.ruleData = JSON.stringify(ruleData);
}

// Hide the input layer
function hideInput()
{
	frontLayer.style.display="none";
	backLayer.style.display="none";
}

// Delete a rule
function delRule()
{
	ruleData.splice(selRuleIndex, 1);
	localStorage.ruleData = JSON.stringify(ruleData);
	table.deleteRow(selRuleIndex);

	selRuleIndex = 0;
	sendUpdateMsg();
}

// Listener
function selRule(e)
{
	var tds = table.getElementsByClassName("sel-td");
	while(tds.length > 0) {
		tds[0].className = "";
	}

	if(arguments.length == 0) {
		var elem = table.getElementsByTagName("tr")[selRuleIndex];
		for(var i = 0; i < tableColNum; i++) {
			elem.cells[i].className = "sel-td";
		}
		return;
	}

	var elem = e.srcElement;
	while(!/^tr$/i.test(elem.tagName)) {
		if(/^th$/i.test(elem.tagName) || /^body$/i.test(elem.tagName)) {
			return;
		}
		elem = elem.parentElement;
	}

	selRuleIndex = elem.rowIndex;


	for(var i = 0; i < tableColNum; i++) {
		elem.cells[i].className = "sel-td";
	}
}

// Desktop Notification
function desktopNotif(title, text, timeout) {
	var notif = webkitNotifications.createNotification("/icons/icon_48.png", title, text);
	notif.show();
	setTimeout(function() {
		notif.cancel();
	}, timeout * 1000);
}

// Send update message
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
	if(tag.innerText == "Preferences") {
		preferences.className = "mainview-sel";
	} else /*if(tag.innerText == "Manage Rules") */{
		manageRules.className = "mainview-sel";
	}
}

// Load Preferences page
function loadPref()
{
	//prefs = JSON.parse(localStorage.prefs);
}

// Preferences: Save changes
function savePrefChg()
{
	//localStorage.prefs = JSON.stringify(prefs);
}

// Preferences: Discard changes
function cancelPrefChg()
{
	loadPref();
}
