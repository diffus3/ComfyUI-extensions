// Node that allows you to redirect connections for cleaner graphs

import { app } from "/scripts/app.js";
import { ComfyWidgets } from '/scripts/widgets.js'


const validateLinks = function(node) {
	node.inputs.forEach((input) => {
		if (input.type != '*' && input.link != null) {
			const linkId = input.link;
			validateLink(node.graph, linkId);
		}
	})
	node.outputs.forEach((output) => {
		if (output.type != '*' && output.links) {
			output.links.forEach((linkId) => {
				validateLink(node.graph, linkId);
			})
		}
	})
}

const validateLink = function(graph, linkId) {
	console.log("Validating link: " + linkId);
	const link = graph.links[linkId];
	console.log(link);
	console.log(graph);
	const origin = graph._nodes.find((node) => node.id === link.origin_id).outputs[link.origin_slot];
	const target = graph._nodes.find((node) => node.id === link.target_id).inputs[link.target_slot];
	console.log(origin);
	console.log(target);

	if (target.type != origin.type && target.type != '*' && origin.type != '*') {
		graph.removeLink(linkId)
	} else {
		link.type = target.type;
	}
	//const input =
}


app.registerExtension({
	name: "diffus3.MultiReroute",
	registerCustomNodes() {
		class MultiRerouteNode extends LGraphNode {
			defaultVisibility = true;
			serialize_widgets = true;
			constructor() {
				super("Multi Reroute");
				if (!this.properties) {
					this.properties = {};
				}
				this.properties.showOutputText = MultiRerouteNode.defaultVisibility;


				this.addInput('', '*');
				this.addOutput(this.properties.showOutputText ? "*" : "", '*');

				// This node is purely frontend and does not impact the resulting prompt so should not be serialized
				this.isVirtualNode = true;
			}

            onConnectionsChange(
                pinType, //1 = input, 2 = output
                slot, 
                isChangeConnect,
                link_info,
                pin,
            ) {
                console.log("onConnectionsChange");
                
                const input = this.inputs[slot];
                const output = this.outputs[slot]
                const sourceNode = this.graph?.getNodeById(link_info.origin_id);
                const targetNode = this.graph?.getNodeById(link_info.target_id);
                if (isChangeConnect && this.graph) {
                    const sourceType = sourceNode?.outputs[link_info.origin_slot]?.type;
                    const targetType = targetNode?.inputs[link_info.target_slot]?.type;

                    const sourceAny = sourceType === '*';
                    const targetAny = targetType === '*';

                    console.log('types');
                    console.log(sourceType);
                    console.log(targetType);
                    if (!sourceAny || !targetAny) {
                        const t = !sourceAny ? sourceType : targetType;
                        this.setSlot(slot, t);
                    }
                    //this.inputs[slot].name = 
                } else if (input && output && !input.link && (!output.links || output.links.length == 0)) {
                    this.setSlot(slot, '*');
                }
        

                //validateLinks(this);
                //this.inputs[slot].name = 
                
                
                //console
                //console.log(pinType);
                //console.log(pin);
                //console.log(link_info);
            }

            setSlot(slot, type) {
				console.log("setSlot");
                this.inputs[slot].type = type;
                this.inputs[slot].name = type;
                this.outputs[slot].type = type;
                this.outputs[slot].name = type;
				console.log(this.inputs[slot]);
				const linkId = this.inputs[slot].link;
				const link = this.graph.links[linkId];
				if (link && link.type != this.inputs[slot].type) {
					link.type = this.inputs[slot].type;
					const otherNode = this.graph.getNodeById(link.origin_id);
					if (otherNode.onConnectionsChange) {
						otherNode.onConnectionsChange(
							LiteGraph.OUTPUT,
							link.origin_slot,
							true,
							link,
							otherNode.outputs[link.origin_slot],
						);
					}
					console.log(link);
				}
            }


            clone() {
                console.log("CLONE");
                const cloned = super.clone.apply(this);
                this.inputs.forEach((input) => {
                    input.type = '*';
                    input.name = '*';
                });
                this.inputs.forEach((output) => {
                    output.type = '*';
                    output.name = '*';
                })
                //cloned.inputs = [];
                //cloned.inputs[0].name = '*';
                //cloned.inputs[0].type = '*';
                //cloned.properties.previousName = '';
                //cloned.size = cloned.computeSize();
                return cloned;
            };


			onAdded(graph) {
				//this.computeSize();
				//this.onResize();
				//this.update();
				//this.validateName(graph);
			}

            getExtraMenuOptions(_, options) {
				options.unshift(
					{
						content: (this.properties.showOutputText ? "Hide" : "Show") + " Type",
						callback: () => {
							this.properties.showOutputText = !this.properties.showOutputText;
							if (this.properties.showOutputText) {
								this.outputs[0].name = this.__outputType || this.outputs[0].type;
							} else {
								this.outputs[0].name = "";
							}
							this.size = this.computeSize();
							app.graph.setDirtyCanvas(true, true);
						},
						
					},
					{
						content: (MultiRerouteNode.defaultVisibility ? "Hide" : "Show") + " Type By Default",
						callback: () => {
							MultiRerouteNode.setDefaultTextVisibility(!MultiRerouteNode.defaultVisibility);
						},
					},
                    {
                        content: "Add Input/Output pair",
                        callback: () => {
                            this.addInput('', '*');
                            this.addOutput(this.properties.showOutputText ? "*" : "", '*');
                            this.computeSize();
                        },
                    },
                    {
                        content: "Remove Input/Output pair",
						enabled: this.inputs.length > 1 && this.outputs.length > 1,
                        callback: () => {
							if (this.inputs.length > 1 && this.outputs.length > 1) {
								this.removeInput(this.inputs.length -1)
								this.removeOutput(this.outputs.length -1)
							}
                            this.computeSize();
                        },
                    },
				);
			}
			computeSize() {
				return [
					this.properties.showOutputText && this.outputs && this.outputs.length
						? Math.max(75, LiteGraph.NODE_TEXT_SIZE * this.outputs[0].name.length * 0.6 + 40)
						: 75,
					(this.outputs && this.outputs.length > 1) ? 26 + (this.outputs.length - 1) * 20 : 26,
				];
			}

			static setDefaultTextVisibility(visible) {
				MultiRerouteNode.defaultVisibility = visible;
				if (visible) {
					localStorage["diffus3.MultiReroute.DefaultVisibility"] = "true";
				} else {
					delete localStorage["diffus3.MultiReroute.DefaultVisibility"];
				}
			}
		}


		// Load default visibility
		MultiRerouteNode.setDefaultTextVisibility(!!localStorage["diffus3.MultiReroute.DefaultVisibility"]);

		LiteGraph.registerNodeType(
			"diffus3.MultiReroute",
			Object.assign(MultiRerouteNode, {
				title_mode: LiteGraph.NO_TITLE,
				title: "Multi Reroute",
				collapsable: false,
			})
		);

		MultiRerouteNode.category = "utils";
	},
});
