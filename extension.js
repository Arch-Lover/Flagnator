import * as Main from "resource:///org/gnome/shell/ui/main.js";
import GObject from "gi://GObject";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { Gio, GLib } from "gi://GLib"; // We need these to load the JSON file

// Path to the flags.json file (relative to your extension's directory)
const FLAGS_JSON_PATH = GLib.build_filenamev([GLib.get_current_dir(), "flags.json"]);

// Load the flags.json file and parse it into an object
let flagEmojis = {};

try {
    let file = Gio.File.new_for_path(FLAGS_JSON_PATH);
    let content = file.load_contents(null)[1].toString();  // Read the content of the file
    flagEmojis = JSON.parse(content);  // Parse the JSON content into an object
} catch (e) {
    console.error("Error loading flags JSON:", e);
}

// Flagnator Class
var Flagnator = GObject.registerClass(
    {
        GTypeName: "Flagnator",  // GTypeName for the new class
    },
    class Flagnator extends GObject.Object {
        constructor() {
            super();
            this._keyboard = Main.panel.statusArea.keyboard;
            this._signalId = 0;
            this._originalIndicatorTexts = [];
        }

        enable() {
            // Check if the language indicator is available
            if (!this._keyboard) {
                console.log("Language indicator not available, extension disabled");
                return;
            }

            this._signalId = this._keyboard._inputSourceManager.connect(
                "current-source-changed",
                this._updateIndicator.bind(this)
            );
            this._updateIndicator();
        }

        disable() {
            if (this._signalId) {
                this._keyboard._inputSourceManager.disconnect(this._signalId);
                this._signalId = 0;
                this._restoreIndicator();
            }
        }

        _updateIndicator() {
            let source = this._keyboard._inputSourceManager.currentSource;

            if (source) {
                let shortName = source.shortName.toLowerCase();  // Get the language code (lowercase)
                let flagEmoji = flagEmojis[shortName];  // Get the flag emoji from the loaded JSON data

                if (flagEmoji) {
                    let children = this._keyboard._container.get_children();
                    for (let i = 0; i < children.length; i++) {
                        let child = children[i];
                        if (this._originalIndicatorTexts[i] === undefined) {
                            this._originalIndicatorTexts[i] = child.get_text();
                        }

                        // Replace the text with the flag emoji
                        child.set_text(flagEmoji);
                    }
                }
            }
        }

        _restoreIndicator() {
            let children = this._keyboard._container.get_children();
            for (let i = 0; i < children.length; i++) {
                if (this._originalIndicatorTexts[i] !== undefined) {
                    children[i].set_text(this._originalIndicatorTexts[i]);
                }
            }
            this._originalIndicatorTexts = [];
        }
    }
);

let _indicator;

export default class FlagnatorExtension extends Extension {  // Extension class for Flagnator
    enable() {
        _indicator = new Flagnator();  // Create the Flagnator object
        _indicator.enable();
    }

    disable() {
        if (_indicator) {
            _indicator.disable();
            _indicator = null;
        }
    }
}

