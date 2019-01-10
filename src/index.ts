import { Calculator } from './Calculator';
import { XmlRpcRequest } from "./mimic";
import { FileChange,
         DataTypes 
} from './fileChange';

import {
  ProvenanceGraph,
  ProvenanceTracker,
  ProvenanceGraphTraverser,
  ActionFunctionRegistry,
  ProvenanceSlide,
  ProvenanceSlidedeck,
  ProvenanceSlidedeckPlayer,
} from '@visualstorytelling/provenance-core';

import { ProvenanceTreeVisualization } from '@visualstorytelling/provenance-tree-visualization';

// import { SlideDeckVisualization } from '@visualstorytelling/slide-deck-visualization';

import 'normalize.css';
import './style.scss';
import '@visualstorytelling/slide-deck-visualization/dist/bundle.css';
import * as io from "socket.io-client";
// import './fileChange.ts';


const visDiv: HTMLDivElement = document.getElementById('vis') as HTMLDivElement;
const stateDiv: HTMLDivElement = document.getElementById(
  'state',
) as HTMLDivElement;

const increaseBtn: HTMLButtonElement = document.getElementById(
  'increase',
) as HTMLButtonElement;
const decreaseBtn: HTMLButtonElement = document.getElementById(
  'decrease',
) as HTMLButtonElement;
const multiplyBtn: HTMLButtonElement = document.getElementById(
  'multiply',
) as HTMLButtonElement;
const divideBtn: HTMLButtonElement = document.getElementById(
  'divide',
) as HTMLButtonElement;
const updateCommentBtn: HTMLButtonElement = document.getElementById(
  'makeComment',) as HTMLButtonElement;
const updateJumpBtn: HTMLButtonElement = document.getElementById(
  'makeJump',) as HTMLButtonElement;
const updateColorBtn: HTMLButtonElement = document.getElementById(
  'makeColor',) as HTMLButtonElement;
const updateUndoBtn: HTMLButtonElement = document.getElementById(
  'makeUndo',) as HTMLButtonElement;

  
// const graph = new ProvenanceGraph({ name: 'calculator', version: '1.0.0' });
const graph = new ProvenanceGraph({ name: 'FileChange', version: '1.0.0' });
const registry = new ActionFunctionRegistry();
const tracker = new ProvenanceTracker(registry, graph);
const traverser = new ProvenanceGraphTraverser(registry, graph);
// const calculator = new Calculator(graph, registry, tracker, traverser);
const fileChange = new FileChange(graph, registry, tracker, traverser);

// Setup named pipe with server
console.log("Try to logon...");
var socket = io.connect('http://localhost:8082');

socket.on("connected", function(data: any) {
    console.log("Connected User?", data.accept);
});

var requestFile = socket.on("fileChanged", async (data: string) => {
    // $("#dataFile").html(data + "<br/>");
    console.log("typeof data: " + typeof data);
    if (data && data.length !== 0 ) {
        console.log(data);     
        let newNode = new DataTypes(data);
        // Node operations:
        if (newNode.type == 'comment') {
            const node = await tracker.applyAction({      
                do: 'comment',
                doArguments: [newNode.address, newNode.comment],
                undo: 'comment',           
                undoArguments: [newNode.address, newNode.oldcomment],      
                metadata: {
                  createdBy: 'me',
                  createdOn: 'now',
                  tags: [],
                  userIntent: 'test',
                },
            });
            node.label = "comment "+newNode.address;
        } 
        else if (newNode.type == 'view') {
            const node = await tracker.applyAction({       
                do: 'view',
                doArguments: [newNode.address, newNode.view],
                undo: 'view',           
                undoArguments: [newNode.oldaddress, newNode.oldview], 
                metadata: {
                  createdBy: 'me',
                  createdOn: 'now',
                  tags: [],
                  userIntent: 'view',
                },
            });
            node.label = "view "+newNode.address;
        }
        else if (newNode.type == 'func') {
            const node = await tracker.applyAction({      
                do: 'func',
                doArguments: [newNode.address, newNode.newFunc],
                undo: 'func',           
                undoArguments: [newNode.address, newNode.oldFunc],      
                metadata: {
                  createdBy: 'me',
                  createdOn: 'now',
                  tags: [],
                  userIntent: 'func',
                },
            });
            node.label = "func "+newNode.newFunc;
        }
        else {
            // Placeholder for future node types
        }
    }
    
});

graph.on('currentChanged', (event) => {
  stateDiv.innerHTML = fileChange.currentState();
});


fileChange.setupBasicGraph().then(() => {
let provenanceTreeVisualization = new ProvenanceTreeVisualization(
  traverser,
  visDiv,
);
});

// increaseBtn.addEventListener('click', async () => {
//   const node = await tracker.applyAction({
//     do: 'add',
//     doArguments: [5],
//     undo: 'subtract',
//     undoArguments: [5],
//     metadata: {
//       createdBy: 'me',
//       createdOn: 'now',
//       tags: [],
//       userIntent: 'add',
//     },
//   });
//   node.label = 'add 5';
// });

// decreaseBtn.addEventListener('click', async () => {
//   const node = await tracker.applyAction({
//     do: 'subtract',
//     doArguments: [5],
//     undo: 'add',
//     undoArguments: [5],
//     metadata: {
//       createdBy: 'me',
//       createdOn: 'now',
//       tags: [],
//       userIntent: 'subtract',
//     },
//   });
//   node.label = 'subtract 5';
// });

// multiplyBtn.addEventListener('click', async () => {
//   const node = await tracker.applyAction({
//     do: 'multiply',
//     doArguments: [5],
//     undo: 'divide',
//     undoArguments: [5],
//     metadata: {
//       createdBy: 'me',
//       createdOn: 'now',
//       tags: [],
//       userIntent: 'multiply',
//     },
//   });
//   node.label = "multiply 5";
// });

// divideBtn.addEventListener('click', async () => {
//   const node = await tracker.applyAction({
//     do: 'divide',
//     doArguments: [5],
//     undo: 'multiply',
//     undoArguments: [5],
//     metadata: {
//       createdBy: 'me',
//       createdOn: 'now',
//       tags: [],
//       userIntent: 'divide',
//     },
//   });
//   node.label = 'divide 5';
// });

updateCommentBtn.addEventListener('click', async () => {
  const method = "MakeComm";
  let request = new (XmlRpcRequest as any)("http://localhost:1337/RPC2", method);
  request.addParam((<HTMLInputElement>document.getElementById("n1")).value);
  request.addParam((<HTMLInputElement>document.getElementById("n2")).value);
  let response = await request.send();
  console.log(response);
});

updateJumpBtn.addEventListener('click', async () => {
  const method = "Jump";
  let request = new (XmlRpcRequest as any)("http://localhost:1337/RPC2", method);
  request.addParam((<HTMLInputElement>document.getElementById("n3")).value);
  let response = await request.send();
  console.log(response);
});

updateColorBtn.addEventListener('click', async () => {
  const method = "SetColor";
  let request = new (XmlRpcRequest as any)("http://localhost:1337/RPC2", method);
  request.addParam((<HTMLInputElement>document.getElementById("n4")).value);
  request.addParam((<HTMLInputElement>document.getElementById("n5")).value);
  let response = await request.send();
  console.log(response);
});

updateUndoBtn.addEventListener('click', async () => {
  const method = "Undo";
  let request = new (XmlRpcRequest as any)("http://localhost:1337/RPC2", method);
  let response = await request.send();
  console.log(response);
});

// graph.on('currentChanged', (event) => {
//   stateDiv.innerHTML = calculator.currentState().toString();
// });

// // let provenanceTreeVisualization: ProvenanceTreeVisualization;

// calculator.setupBasicGraph().then(() => {
//   let provenanceTreeVisualization = new ProvenanceTreeVisualization(
//     traverser,
//     visDiv,
//   );
// });

// graph.on('currentChanged', (event) => {
//   stateDiv.innerHTML = fileChange.currentState();
// });


// fileChange.setupBasicGraph().then(() => {
//   let provenanceTreeVisualization = new ProvenanceTreeVisualization(
//     traverser,
//     visDiv,
//   );
// });

