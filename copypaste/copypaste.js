import { app } from "/scripts/app.js";
const ext = {
    name: "diffus3.copypaste",
    
    init() {
        console.log("initializing copypaste");
        const canvas = app.canvas;

        const old = canvas.getExtraMenuOptions;
        canvas.getExtraMenuOptions = function(canvas, options) {
            const selected = canvas.selected_nodes;
            //console.log("selected:");
            //console.log(selected);
            const copyDisabled = (Object.keys(selected).length === 0);
            const clipboard = localStorage.getItem("litegrapheditor_clipboard")
            const pasteDisabled = !clipboard;
            const extra = []
            if (old) {
                extra.push(...old())
            }
            extra.push(...[
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
                
            ]);
            return extra;
        }
    },
    
    /*
    getExtraMenuOptions(canvas, options) {
        const selected = canvas.selected_nodes;
        //console.log("selected:");
        //console.log(selected);
        const copyDisabled = (Object.keys(selected).length === 0);
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
    },
    */
    
};

app.registerExtension(ext);
