import { app } from "/scripts/app.js";
import { ComfyWidgets } from '/scripts/widgets.js'


const showInputDialog = function(node, labels, callback, initialValues = []) {
	const options = { checkForInput: false, closeOnLeave: false, closeOnLeave_checkModified: false };
	

	/*
	labels.forEach((label) => {
		result[label] = '';
	})
	*/

	const html = `
		<div style="display: flex; flex-direction: column">
			${labels.reduce((accumulator, current, i) => {
				accumulator += "<div>"
				accumulator += "<span style='color: #ccc'>" + current + "</span>"
				accumulator += "<input " + (i == 0 ? 'autofocus ' : '') +" type='text' style='background-color: #ccc'/>"
				accumulator += "</div>"
				return accumulator;
			}, '')}
			<button style='flex: 1; border-radius: 3px; padding-top: 3px; padding-bottom: 3px; padding-left: 10px; padding-right: 10px'>OK</button>
		</div>
	`

	var dialog = app.canvas.createDialog(
		html,
		//"<span class='name' style='color: #ccc'>Name</span><input autofocus type='text'/><button style='border-radius: 3px; padding-top: 3px; padding-bottom: 3px; padding-left: 10px; padding-right: 10px'>OK</button>",
		//"<div style='padding: 15px; border-radius: 10px'><span class='name'>Name</span><textarea autofocus type='text' rows='5'/><button>OK</button></div>",
		options
	);
	var inputs = dialog.querySelectorAll("input");
	
	inputs.forEach((input, i) => {
		if (input && initialValues[i]) {
			input.value = initialValues[i];
		}
		
		input.addEventListener("keydown", function(e) {
			dialog.is_modified = true;
			if (e.keyCode == 27) {
				//ESC
				dialog.close();
			} else if (e.keyCode == 13) {
				inner(); // save
			} else if (e.keyCode != 13 && e.target.localName != "textarea") {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
		});
	})

	var inner = function(){
		node.graph.beforeChange();


		const result = [];
		inputs.forEach((input) => result.push(input.value));

		callback(result);
		dialog.close();
		node.graph.afterChange();
	}
	dialog.querySelector("button").addEventListener("click", inner);
	if (inputs.length > 0) {
		inputs[0].focus();
	}
}


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


class VariablePinNode extends LGraphNode {

	tempIn = undefined;
	tempOut = undefined;
	nextInput = 1;
	nextOutput = 1;

	constructor(title) {
		super(title);
	}

	computeSize() {
		const standard = super.computeSize();
		const modified = [standard[0], standard[1] + 20];
		console.log(standard);
		console.log(modified);

		return modified;
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
		console.log("---");
		console.log("MouseLeave");
		console.log(e);
		/*
		const connectingInput = app.canvas.connecting_input;
		if (connectingInput) {
			console.log("connecting input:");
			console.log(connectingInput);
		}

		const connectingOutput = app.canvas.connecting_output
		if (connectingOutput) {
			console.log("connecting output:");
			console.log(connectingOutput);
		}
		*/

		this.removeTemporary();
	}

	onConnectInput(target_slot, type, output, x, slot) {
		//console.log(target_slot);
		//console.log(slot);
		
		if (target_slot == this.inputs.length - 1) {
			this.tempIn = undefined;
			this.inputs[target_slot].name = "in_" + this.nextInput++;
		}
		this.inputs[target_slot].type = type;

		this.removeTemporary();
		//validateLinks(this);
		//target_slot.type = slot.type;
	}

	onConnectOutput(slot, type, input, x, target_slot) {
		//console.log(target_slot);
		//console.log(slot);
		
		if (slot == this.outputs.length - 1) {
			this.tempOut = undefined;
			this.outputs[slot].name = "out_" + this.nextOutput++;
		}
		this.outputs[slot].type = type;


		this.removeTemporary();
		//validateLinks(this);
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

	getExtraMenuOptions(_, options) {
		if (super.getExtraMenuOptions) {
			super.getExtraMenuOptions(_, options);
		}
		options.unshift(
			{
				content: "Add Input",
				callback: () => {
					this.computeSize();
					const that = this;
					const cb = function(o) {
						console.log("callback");
						console.log(o);
						that.addInput(o[0], o[1]);
					}

					showInputDialog(this, ['Name', 'Type'], cb)
					/*
					this.properties.showOutputText = !this.properties.showOutputText;
					if (this.properties.showOutputText) {
						this.outputs[0].name = this.outputs[0].type;
					} else {
						this.outputs[0].name = "";
					}
					this.size = this.computeSize();
					app.graph.setDirtyCanvas(true);
					*/
				},
			},
			{
				content: "Add Output",
				callback: () => {
					//RerouteNode.setDefaultTextVisibility(!RerouteNode.defaultVisibility);
				},
			}
		);
	}
}

app.registerExtension({
	name: "Comfy.SubgraphNode",
	registerCustomNodes() {
		class SubgraphNode extends VariablePinNode {
			defaultVisibility = true;
			serialize_widgets = true;
			subgraph = undefined;
			static input_node_type = "SubgraphIn";
			static output_node_type = "SubgraphOut";
			constructor() {
				super("Subgraph");
				if (!this.properties) {
					this.properties = {
						"subgraph": '',
					};
				}
				this.properties.showOutputText = SubgraphNode.defaultVisibility;

				this.subgraph = new LGraph();
				this.subgraph._subgraph_node = this;

				// This node is purely frontend and does not impact the resulting prompt so should not be serialized
				this.isVirtualNode = true;
			}

			onSerialize(o) {
				if (this.subgraph) {
					//console.log("serializing subgraph");
					const g = this.subgraph.serialize()
					//o.subgraph = g;
					//this.properties.subgraph = JSON.stringify(g);
					o.properties.subgraph = JSON.stringify(g);
					//console.log(g);
				} else {
					console.log("no subgraph");
				}

				//console.log(o);
				/*
				let o = {}
				if (super.serialize) {
					let o = super.serialize();
				}
				console.log(o);
				o.subgraph = this.subgraph;
				*/
			}

			onConfigure(info) {
				if (this.properties.subgraph) {
					if (!this.subgraph) {
						this.subgraph = new LGraph();
					} else {
						const g = JSON.parse(this.properties.subgraph);
						this.subgraph.configure(g);
					}
				}
				console.log("onConfigure");
			}

			/*
			getExtraMenuOptions(_, options) {
				if (super.getExtraMenuOptions) {
					super.getExtraMenuOptions(_, options);
				}
			}
			*/



			onAdded(graph) {
				//this.computeSize();
				//this.onResize();
				//this.update();
				//this.validateName(graph);
			}


			/**
			 * Handles connections from the node's outputs to the subgraph
			 * @param {number} slot 
			 */
			
			getInputLink = function(slot) {
				console.log("getInputLink(): " + slot)
				const outputNodes = this.subgraph._nodes.filter((nodeInSubgraph) => {
					const name = this.outputs[slot].name;
					console.log(nodeInSubgraph);
					if (nodeInSubgraph.type === 'SubgraphOut' && nodeInSubgraph.widgets[0].value === this.outputs[slot].name) {
						console.log("Output node found!");
						return true;
					}
					return false;
				})

				console.log(outputNodes);

				const slot_info = outputNodes[0].inputs[slot];
				const link = this.subgraph.links[ slot_info.link ];

				console.log("link");
				console.log(link);
				return link;
			}
			
			

			
		}


		LiteGraph.registerNodeType(
			"Subgraph",
			Object.assign(SubgraphNode, {
				title: "Subgraph",
			})
		);

		SubgraphNode.category = "utils";
	},
});



app.registerExtension({
	name: "Comfy.SubgraphOutNode",
	registerCustomNodes() {
		class SubgraphOutNode extends LGraphNode {
			defaultVisibility = true;
			serialize_widgets = true;
			constructor() {
				super("Output");
				if (!this.properties) {
					this.properties = {
						"previousName": ""
					};
				}
				this.properties.showOutputText = SubgraphOutNode.defaultVisibility;

				const node = this;

				
				/*
				this.addWidget(
					"text", 
					"Variable", 
					"", 
					(s, t, u, v, x) => {
						node.validateName(node.graph);
						this.update();
						this.properties.previousName = this.widgets[0].value;
					}, 
					{}
				)
				*/

				this.addWidget(
					"combo",
					"Output",
					"",
					(e) => {

						console.log("in");
						console.log(e);

						const subgraphNode = this.graph._subgraph_node;
						let output = undefined
						if (subgraphNode.outputs && subgraphNode.outputs.length > 0) {
							output = subgraphNode.outputs.find((output) => output.name == e);
						}
						if (output) {
							this.setProperty("name", output.name);
							this.setProperty("type", output.type);
						} else {
							this.setProperty("name", '*');
							this.setProperty("type", '*');
						}
						this.update();
						/*
						console.log("in");
						console.log(e);

						const subgraphNode = this.graph._subgraph_node;
						if (subgraphNode.outputs && subgraphNode.outputs.length > 0) {
							//this.widgets[0].options.values = subgraphNode.inputs.map((input) => input.name);
							const input = subgraphNode.outputs.find((input) => output.name == e);
							if (input) {
								this.inputs[0].name = input.type;
								this.inputs[0].type = input.type;
								return;
							}
						}
						this.inputs[0].name = '*';
						this.inputs[0].type = '*';
						*/
					},
					{
						values: []
					}
				)
				
				this.addInput("*", "*");

				this.onAdded = function(graph) {
					this.setComboValues();
					//this.validateName(graph);
				}

				this.setComboValues = function() {
					const subgraphNode = this.graph._subgraph_node;
					//console.log(this.graph._subgraph_node);
					//console.log(this.graph.outputs);
					if (subgraphNode && subgraphNode.outputs && subgraphNode.outputs.length > 0) {
						this.widgets[0].options.values = subgraphNode.outputs.map((output) => output.name);
						//this.widgets[0].options.values = ["test", "test"];
						//console.log(subgraphNode.outputs);
					} else {
						this.widgets[0].options.values = [];
					}
				}

				this.update = function() {
					console.log("updating");
					console.log(this.properties);
					this.inputs[0].name = this.properties.type;
					this.inputs[0].type = this.properties.type;
					this.widgets[0].value = this.properties.name;
					validateLinks(this);
				}


				/*
				this.validateLinks = function() {
					console.log("validating links");
					//console.log(this.inputs[0].link);
					//console.log(this.inputs[0]);
					if (this.inputs[0].type != '*' && this.inputs[0].link) {
						const linkId = this.inputs[0].link
						const link = node.graph.links[linkId];

						console.log("linkId: " + linkId);
						console.log(link);
						if (link && link.type != this.inputs[0].type) {
							console.log("removing link");
							node.graph.removeLink(linkId)
						}
					} 
				}
				*/

				// This node is purely frontend and does not impact the resulting prompt so should not be serialized
				this.isVirtualNode = true;
			}


			setProperty(name, value) {
				super.setProperty(name, value);
				this.update();
			}

		}

		LiteGraph.registerNodeType(
			"SubgraphOut",
			Object.assign(SubgraphOutNode, {
				title: "Output",
			})
		);

		SubgraphOutNode.category = "utils";
	},
});


app.registerExtension({
	name: "Comfy.SubgraphInNode",
	registerCustomNodes() {
		class SubgraphInNode extends LGraphNode {

			defaultVisibility = true;
			serialize_widgets = true;

			constructor() {
				super("Input");
				if (!this.properties) {
					this.properties = {
						name: "",
						type: "",
					};
				}
				this.properties.showOutputText = SubgraphInNode.defaultVisibility;
				
				const node = this;
				this.addWidget(
					"combo",
					"Input",
					"",
					(e) => {
						console.log("in");
						console.log(e);

						const subgraphNode = this.graph._subgraph_node;
						let input = undefined
						if (subgraphNode.inputs && subgraphNode.inputs.length > 0) {
							input = subgraphNode.inputs.find((input) => input.name == e);
						}
						if (input) {
							this.setProperty("name", input.name);
							this.setProperty("type", input.type);
						} else {
							this.setProperty("name", '*');
							this.setProperty("type", '*');
						}
						this.update();
					},
					{
						values: []
					}
				)

				this.addOutput("*", '*');


				this.onAdded = function(graph) {
					this.setComboValues();
					//this.update();
					//this.validateName(graph);
				}

				this.afterChange = function() {
					this.update();
				}

				this.setComboValues = function() {
					const subgraphNode = this.graph._subgraph_node;
					if (subgraphNode && subgraphNode.inputs && subgraphNode.inputs.length > 0) {
						this.widgets[0].options.values = subgraphNode.inputs.map((input) => input.name);
					} else {
						this.widgets[0].options.values = [];
					}
				}

				this.update = function() {
					console.log("updating");
					console.log(this.properties);
					this.outputs[0].name = this.properties.type;
					this.outputs[0].type = this.properties.type;
					this.widgets[0].value = this.properties.name;
					validateLinks(this);
				}

				/*
				this.validateLinks = function() {
					
					console.log("validating links");
					if (this.outputs[0].type != '*' && this.outputs[0].links) {
						console.log("in");
						this.outputs[0].links.forEach((linkId) => {
							const link = node.graph.links[linkId];
							if (link && link.type != this.outputs[0].type && link.type != '*') {
								console.log("removing link");
								node.graph.removeLink(linkId)
							}
						})
					} 
					
				}
				*/

				// This node is purely frontend and does not impact the resulting prompt so should not be serialized
				this.isVirtualNode = true;
			}
			setProperty(name, value) {
				super.setProperty(name, value);
				this.update();
			}


			/**
			 * Handles connections from the node to the parent graph of the graph that this node belongs to.
			 * @param {number} slot 
			 */
			
			getInputLink = function(slot) {
				console.log("SubgraphInNode.getInputLink(): " + slot)

				if (slot != 0) {
					throw new Error("Only one slot exists for SubgraphInNode")
				}

				const nodeInParentGraph = this.graph._subgraph_node
				if (nodeInParentGraph) {
					console.log("nodeInParentGraph: ")
					console.log(nodeInParentGraph);
					const name = this.widgets.value;
					const input = nodeInParentGraph.inputs.find((input) => input.name === name);
					console.log(input);
					//const link = nodeInParentGraph.graph.links[]
				} else {
					throw new Error("Input node in a graph with no parent.");
				}
			}
			
		}

		LiteGraph.registerNodeType(
			"SubgraphIn",
			Object.assign(SubgraphInNode, {
				title: "Input",
			})
		);

		SubgraphInNode.category = "utils";
	},
});
