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

/*
class VariablePinNode extends LGraphNode {

	tempIn = undefined;
	tempOut = undefined;
	//nextInput = 1;
	//nextOutput = 1;

	constructor(title) {
		super(title);
	}

	onMouseEnter(e) {
		console.log("---");
		console.log("MouseEnter");
		console.log(e);
		const connectingInput = app.canvas.connecting_input;
		if (connectingInput) {
			console.log("connecting input:");
			console.log(connectingInput);
			if (!this.tempOut) {
				this.tempOut = this.addOutput('*', '*');
				this.tempOut.removable = true;
			}
		}

		const connectingOutput = app.canvas.connecting_output
		if (connectingOutput) {
			console.log("connecting output:");
			console.log(connectingOutput);
			if (!this.tempIn) {
				this.tempIn = this.addInput('*', '*');
				this.tempIn.removable = true;
			}
		}
	}

	onMouseLeave(e) {
		this.removeTemporary();
	}

    onConnectionsChange(
        slotType,	//1 = input, 2 = output
        slot,
        isChangeConnect,
        link_info,
        output
    ) {
        console.log("onConnectionsChange");
        //On Input Disconnect
        if (slotType == 1 && !isChangeConnect) {
            this.inputs[slot].type = '*';
            this.inputs[slot].name = '*';
            this.outputs[slot].type = '*';
            this.outputs[slot].name = '*';
        }

        //On Connect
        if (node.graph && slotType == 1 && isChangeConnect) {
            const fromNode = node.graph._nodes.find((otherNode) => otherNode.id == link_info.origin_id);
            const type = fromNode.outputs[link_info.origin_slot].type;

            this.inputs[0].type = type;
            this.inputs[0].name = type;
        }

        //Update either way
        this.update();
    }

	onConnectInput(target_slot, type, output, x, slot) {
		if (target_slot == this.inputs.length - 1) {
			this.tempIn = undefined;
			//this.inputs[target_slot].name = "in_" + this.nextInput++;
		}
        //this.inputs[target_slot].type = type;
		//this.inputs[target_slot].type = type;
		this.removeTemporary();
	}

	onConnectOutput(slot, type, input, x, target_slot) {
		if (slot == this.outputs.length - 1) {
			this.tempOut = undefined;
			this.outputs[slot].name = "out_" + this.nextOutput++;
		}
		//this.outputs[slot].type = type;

		this.removeTemporary();
	}

	removeTemporary() {
		if (this.tempOut) {
			this.outputs.pop();
			this.tempOut = undefined
		}
		if (this.tempIn) {
			this.inputs.pop();
			this.tempIn = undefined
		}
	}

	static setDefaultTextVisibility(visible) {
		MultiRerouteNode.defaultVisibility = visible;
		if (visible) {
			localStorage["Comfy.RerouteNode.DefaultVisibility"] = "true";
		} else {
			delete localStorage["Comfy.RerouteNode.DefaultVisibility"];
		}
	}
}
*/

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
                this.inputs[slot].type = type;
                this.inputs[slot].name = type;
                this.outputs[slot].type = type;
                this.outputs[slot].name = type; 
            }

            /*
            onConnectInput(target_slot, type, output, x, slot) {
                this.inputs[target_slot].type = type;
                this.inputs[target_slot].type = type;
                this.removeTemporary();
            }

            onConnectOutput(slot, type, input, x, target_slot) {
                this.inputs[target_slot].type = type;
                this.inputs[target_slot].type = type;
                //this.outputs[slot].type = type;

                this.removeTemporary();
            }
            */


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
                if (super.getExtraMenuOptions) {
                    super.getExtraMenuOptions(_, options);
                }
                options.unshift(
                    {
                        content: "Add Input/Output pair",
                        callback: () => {
                            this.addInput('*', '*');
                            this.addOutput('*', '*');
                            this.computeSize();
                        },
                    },
                );
            }
		}


		LiteGraph.registerNodeType(
			"diffus3.MultiReroute",
			Object.assign(MultiRerouteNode, {
				title: "Multi Reroute",
			})
		);

		MultiRerouteNode.category = "utils";
	},
});
