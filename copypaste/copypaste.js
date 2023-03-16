import { app } from "/scripts/app.js";
const ext = {
    name: "someanon.copypaste",
    async addCustomNodeDefs(defs, app) {},
    async beforeRegisterNodeDef(nodeType, nodeData, app) {},
    async registerCustomNodes(app) {
        console.log("Registering copypaste");
        app.canvas.getExtraMenuOptions = function(_, options) {
            const selected = app.canvas.selected_nodes;
            const copyDisabled = Object.keys(selected).length === 0;
            const clipboard = localStorage.getItem("litegrapheditor_clipboard")
            const pasteDisabled = !clipboard;
            const extra = [
                {
                    content: "Copy",
                    has_submenu: false,
                    callback: () => app.canvas.copyToClipboard(),
                    disabled: copyDisabled,
                },
                {
                    content: "Paste",
                    has_submenu: false,
                    callback: () => app.canvas.pasteFromClipboard(),
                    disabled: pasteDisabled,
                },
                
                {
                    content: "Clear clipboard",
                    has_submenu: false,
                    callback: () => { localStorage.setItem("litegrapheditor_clipboard", "")},
                    disabled: pasteDisabled,
                }
                
            ]
            return extra;
        }
    }
};

app.registerExtension(ext);
