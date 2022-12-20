const bplist = require('bplist-parser');
const creator = require('bplist-creator');
const fs = require('fs');
const glob = require("glob")
const tilde = require('expand-tilde');
const sudo = require('check-sudo');

const plistPaths = async () => {
	return new Promise((resolve) => {
		const plistPaths = ['/Library/Preferences/com.apple.windowserver.displays.plist'];

		glob(tilde("~") + "/Library/Preferences/ByHost/*windowserver*.plist", null, (er, paths) => {
			plistPaths.push(paths.pop());
			resolve(plistPaths);
		});
	});
};

(async () => {
	const isSudo = await sudo.checkSudo();

	if (!isSudo) {
		console.error("ERROR: This script has to be run with sudo!");
		return;
	}

	const paths = await plistPaths();

	for (const path of paths) {
		const plist = await bplist.parseFile(path);
		const configs = plist[0].DisplaySets?.Configs || plist[0].DisplayAnyUserSets.Configs;
	
		for (const config of configs) {
			for (const DisplayConfig of config.DisplayConfig) {
				DisplayConfig.LinkDescription = {
					BitDepth: 8,
					EOTF: 0,
					PixelEncoding: 0,
					Range: 1
				};
			}
		}
	
		fs.writeFileSync(path, creator(plist));
	}

	console.log("SUCCESS: Restart macOS to enable RGB output.")
})();
