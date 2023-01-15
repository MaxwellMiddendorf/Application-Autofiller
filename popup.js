changeColor.addEventListener("click", async () => {
	let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	chrome.scripting.executeScript(
		{
			target: { tabId: tab.id },
			func: Main
		}
	);
});
async function Main() {
	console.log("Running...");
	var inputLabels = inputMatcher();
	var autofills = await autofillLoader();
	console.log(inputLabels, autofills);

	
	autofiller();
	console.log("...End")
	
	
	function autofiller() {
		for (let [key, 
			value] of inputLabels) {
			value.focus();
			if (autofills.has(key)) {
				if (value.type === "button") { simpleButtonListHandler(value, key); } else { value.value = autofills.get(key); }
			}
			else if (value.type === "radio") { radioHandler(key, value); }
			else {
			}
			value.style.backgroundColor = "#E2F7FF";
		}
	}
	function radioHandler(key, value) {
		if (["YES", "NO"].includes(key)) {
			let radioFeildSets = Array.from(document.getElementsByTagName("fieldset")).filter(element => element.contains(value));
			radioFeildSets.forEach(fields => {
				Array.from(fields.getElementsByTagName("legend")).forEach(legend => { if (autofills.has(legend.textContent)) { value.click(); } });
			}
			)
		}
	}
	function simpleButtonListHandler(value, key) {
		const watcher = new MutationObserver(() => { })
		watcher.observe(document.querySelector("body"), { subtree: true, childList: true });
		value.click();
		let mutes = watcher.takeRecords();
		Array.from(mutes.pop().addedNodes[0].firstChild.parentElement.getElementsByTagName("li")).forEach(
			li => { if (autofills.get(key).toUpperCase() === li.textContent.toUpperCase()) { li.click(); } }
		)
	}
	function inputMatcher() {
		//find and categorize all inputs
		let inputs = Array.prototype.concat(Array.from(document.getElementsByTagName("input")), Array.from(document.getElementsByTagName("button")));
		let labels = Array.from(document.getElementsByTagName("label"));
		let inputLabels = new Map();
		for (let i = 0; i < inputs.length; i++) {
			for (let j = 0; j < labels.length; j++) {
				if (labels[j].htmlFor === inputs[i].id) {
					if (labels[j].textContent != null) {
						inputLabels.set(labels[j].textContent.replace('*', '').toUpperCase(), inputs[i]);
					}
				}
			}
		}
		return inputLabels;
	}
	async function autofillLoader() {
		let res = new Map();
		let raw = await fetch(chrome.runtime.getURL("autofills.json"))
			.then(response => response.json())
			.then(res => new Map(Object.entries(res)));
		for (let [key, value] of raw) {
			for (let ele of value) {
				res.set(ele, key);
			}
		}
		return res;
	}
}
