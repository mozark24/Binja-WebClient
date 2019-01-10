import { XmlRpcRequest } from "./mimic";
import * as io from "socket.io-client";
// import $ = require("jquery");
import {
    ActionFunctionRegistry,
    ProvenanceGraph,
    ProvenanceTracker,
    ProvenanceGraphTraverser,
    ReversibleAction,
    IrreversibleAction,
    StateNode,
    Action,
    isReversibleAction,
  } from '@visualstorytelling/provenance-core';


class FileChangeApp {
    public method: string = "Starting...";

    public async undo() {
        this.method = "undo";
        console.log("FileChangeApp " + this.method);
        const call = "Undo";
        let request = new (XmlRpcRequest as any)("http://localhost:1337/RPC2", call);
        let response = await request.send();
        console.log(response);
    }
    public async comment(address: string, message: string) {
        this.method = "comment";
        const call = "MakeComm";
        let request = new (XmlRpcRequest as any)("http://localhost:1337/RPC2", call);
        request.addParam(address);
        request.addParam(message);
        let response = await request.send();
        console.log(response);
        console.log("FileChangeApp " + this.method);
    }
    public async func(address: string, message: string) {
        this.method = "func";
        const call = "SetFunc";
        let request = new (XmlRpcRequest as any)("http://localhost:1337/RPC2", call);
        request.addParam(address);
        request.addParam(message);
        let response = await request.send();
        console.log(response);
        console.log("FileChangeApp " + this.method);
    }
    public async view(address: string, viewMode: string) {        //Jump action for Revert
        this.method = "view";
        const call = "Jump";
        let request = new (XmlRpcRequest as any)("http://localhost:1337/RPC2", call);
        request.addParam(address);
        request.addParam(viewMode);
        let response = await request.send();
        console.log(response);
        console.log("FileChangeApp " + this.method);
    }
}

export class DataTypes {
    //JSON Types:  View, Comment, Function
    public datablock: string;
    public type: string;

    public address: string;   
    public oldaddress: string;

    public view: string;
    public oldview: string;

    public comment: string;    
    public oldcomment: string;

    public newFunc: string;    
    public oldFunc: string;
    
    constructor(datablock: string) {
        this.datablock = datablock;
        this.parseJSON(this.datablock);     //Split up data block
    }
    
    private parseJSON(data: string) {
        let obj:JSON = JSON.parse(data);

        if (Object.keys(obj)[0] == 'function') {
            this.oldFunc = Object.values(obj)[0];
            this.type = Object.values(obj)[1];
            this.newFunc = Object.values(obj)[3];
            this.address = Object.values(obj)[2];
            console.log(this.oldFunc + ' ' + this.newFunc + ' ' + this.address);
        }
        else if (Object.keys(obj)[0] == 'bv.file.view') {
            this.view = Object.values(obj)[0];
            this.oldview = Object.values(obj)[1];
            this.oldaddress = Object.values(obj)[2];
            this.type = Object.values(obj)[3];
            this.address = Object.values(obj)[4];
            
            console.log(this.view + ' ' + this.oldview + ' ' +
                        this.address + ' ' + this.oldaddress);
        }
        else if (Object.keys(obj)[0] == 'comment') {
            this.comment = Object.values(obj)[0];
            this.oldcomment = Object.values(obj)[1];
            this.type = Object.values(obj)[2];
            this.address = Object.values(obj)[3];
            console.log(this.comment + ' ' + this.oldcomment + ' ' + this.address);
        }
    } 
}


export class FileChange {
    private graph: ProvenanceGraph;
    private registry: ActionFunctionRegistry;
    private tracker: ProvenanceTracker;
    private traverser: ProvenanceGraphTraverser;
    private readonly app: FileChangeApp;

    constructor(
        graph: ProvenanceGraph,
        registry: ActionFunctionRegistry,
        tracker: ProvenanceTracker,
        traverser: ProvenanceGraphTraverser,
    ) {
        this.graph = graph;
        this.registry = registry;
        this.tracker = tracker;
        this.traverser = traverser;
        
        this.app = new FileChangeApp();
        this.registry.register('view', this.app.view, this.app);
        this.registry.register('undo', this.app.undo, this.app);
        this.registry.register('comment', this.app.comment, this.app);
        this.registry.register('func', this.app.func, this.app)
    }

    public async makeActionAndApply(
        reversible: boolean,
        label: string,
        doAction: string,
        doArguments: any[],
        undoAction?: string,
        undoArguments?: any[],
      ): Promise<StateNode> {
        let method: Action;
        const intermediate: Action = {
          do: doAction,
          doArguments,
          metadata: {
            createdBy: 'me',
            createdOn: 'now',
            tags: [],
            userIntent: doAction,
          },
        };
        if (reversible) {
            method = {
            ...intermediate,
            undo: undoAction,
            undoArguments,
          } as ReversibleAction;
        } else {
            method = {
            ...intermediate,
          } as IrreversibleAction;
        }
    
        const node = await this.tracker.applyAction(method);
        node.label = label;
        return node;
    }

    public currentState(): string {
        return this.app.method;
    }

    public async setupBasicGraph() {
        const intermediateNode = await this.makeActionAndApply(
            true,
            'view Graph:PE',
            'view',
            ['0x401000', 'Graph:PE'],
            'view',
            ['0x401000', 'Graph:PE'],
          ); 
    }
    
}

// const visDiv: HTMLDivElement = document.getElementById('vis') as HTMLDivElement;
// const stateDiv: HTMLDivElement = document.getElementById(
//   'state',
// ) as HTMLDivElement;


// const graph = new ProvenanceGraph({ name: 'FileChange', version: '1.0.0' });
// const registry = new ActionFunctionRegistry();
// const tracker = new ProvenanceTracker(registry, graph);
// const traverser = new ProvenanceGraphTraverser(registry, graph);
// // const calculator = new Calculator(graph, registry, tracker, traverser);
// const fileChange = new FileChange(graph, registry, tracker, traverser);



// function makeComment() {
//     const method = "MakeComm";
//     let request = new XmlRpcRequest("http://localhost:1337/RPC2", method);
//     request.addParam(document.getElementById("n1")).value;
//     request.addParam(document.getElementById("n2")).value;
//     let response = request.send();
//     console.log(response);
// }
// function makeJump() {
//     const method = "Jump";
//     let request:any = new XmlRpcRequest("http://localhost:1337/RPC2", method);
//     request.addParam(<HTMLElement>document.getElementById("n3")).value;
//     let response = request.send();
//     // alert(response.parseXML());
// }
// function setColor() {
//     const method = "SetColor";
//     let request:any = new XmlRpcRequest("http://localhost:1337/RPC2", method);
//     request.addParam(<HTMLElement>document.getElementById("n4")).value;
//     request.addParam(<HTMLElement>document.getElementById("n5")).value;
//     let response = request.send();
//     // alert(response.parseXML());
// }
// function undo() {
//     const method = "Undo";
//     let request:any = new XmlRpcRequest("http://localhost:1337/RPC2", method);
//     let response = request.send();
//     // alert(response.parseXML());
// }

