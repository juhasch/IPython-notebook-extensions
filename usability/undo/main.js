// quick-and-dirty undo/redo
// WARNING: this will kill you with larger notebooks

define([
    'base/js/namespace',
    'jquery',
    'base/js/events',
    'notebook/js/notebook',  
], function(IPython, $, events, notebook) {
    "use strict";
    if (IPython.version[0] < 3) {
        console.log("This extension requires IPython 3.x");
        return
    }

var commands = [];
var cells = [];
var cells_idx = [];
var cells_json = [];
var stack_position = -1;
var top_position = -1;
var active = false;

var undo_stack = function() {
if (stack_position >= 0 ) {
    var cmd = commands[stack_position];
    var cell = cells[stack_position];
    var json = cells_json[stack_position];
    var idx = cells_idx[stack_position];

    active = true;
    if (cmd === "UP") IPython.notebook.move_cell_down(IPython.notebook.find_cell_index(cell));
    if (cmd === "DOWN") IPython.notebook.move_cell_up(IPython.notebook.find_cell_index(cell));
    if (cmd === "DELETE") {
        var new_cell = IPython.notebook.insert_cell_at_index(json.cell_type, idx);
        new_cell.fromJSON(json);
        IPython.notebook.select(IPython.notebook.find_cell_index(new_cell));
        };
    if (cmd === "INSERT") IPython.notebook.delete_cell(IPython.notebook.find_cell_index(cell));    
    active = false;
    stack_position -= 1;
    console.log("undo", cmd, idx, stack_position, top_position);    
    };
}

var redo_stack = function() {
if (stack_position < top_position) {
    stack_position += 1;
    var cmd = commands[stack_position];
    var cell = cells[stack_position];
    var json = cells_json[stack_position];
    var idx = cells_idx[stack_position];
    
    active = true;
    if (cmd === "DOWN") IPython.notebook.move_cell_down(IPython.notebook.find_cell_index(cell));
    if (cmd === "UP") IPython.notebook.move_cell_up(IPython.notebook.find_cell_index(cell));
    //if (cmd === "DELETE") IPython.notebook.delete_cell(IPython.notebook.find_cell_index(cell));
    if (cmd === "DELETE") IPython.notebook.delete_cell(idx);
    if (cmd === "INSERT") {
        var new_cell = IPython.notebook.insert_cell_at_index(json.cell_type, idx);
        new_cell.fromJSON(json);
        IPython.notebook.select(IPython.notebook.find_cell_index(new_cell));
        };
    active = false;
    
    console.log("redo", cmd, idx, stack_position, top_position);
    };
}

var push_stack = function(cmd, cell) {
    top_position += 1;
    stack_position = top_position;
    commands[stack_position] = cmd;
    cells[stack_position] = cell;
    cells_idx[stack_position] = IPython.notebook.find_cell_index(cell);
    if (cmd === "DELETE") {
        cells_json[stack_position] = cell.toJSON();
    } else {
        cells_json[stack_position] = "" // dummy
    };
    console.log("push", cmd,  stack_position, top_position);
}

    
var original_move_cell_up = notebook.Notebook.prototype.move_cell_up;
var original_move_cell_down = notebook.Notebook.prototype.move_cell_down;
var original_delete_cell = notebook.Notebook.prototype.delete_cell;
var original_undelete_cell = notebook.Notebook.prototype.undelete_cell
var original_insert_cell_at_index = notebook.Notebook.prototype.insert_cell_at_index


notebook.Notebook.prototype.move_cell_up = function() {
    if (active === false) {
        push_stack("UP", this.get_selected_cell());
    };
    original_move_cell_up.apply(this, arguments);
    }

notebook.Notebook.prototype.move_cell_down = function() { 
    if (active === false) {
        push_stack("DOWN", this.get_selected_cell());
    };
    original_move_cell_down.apply(this, arguments) ;
    }

notebook.Notebook.prototype.delete_cell = function() {
    if (active === false) {
        push_stack("DELETE", this.get_selected_cell());
    };
    original_delete_cell.apply(this, arguments);
 };
 
notebook.Notebook.prototype.undelete_cell = function() { 
    if (active === false) {
        push_stack("UNDELETE", this.get_selected_cell());
    };
    original_undelete_cell.apply(this, arguments);
}

var createCell = function(cell,index) {
    if (active === false) {
        push_stack("INSERT", cell);
    };
 }  
   events.on('create.Cell',createCell);
        
   IPython.toolbar.add_buttons_group([
           {
               id : 'undo_op',
               label : 'Undo operation',
               icon : 'fa-undo',
               callback : function () {
                   undo_stack();
                   $('#undo_op').blur() 
                   }
           },
           {
               id : 'redo_op',
               label : 'Redo operation',
               icon : 'fa-repeat',
               callback : function () {
                   redo_stack();
                   $('#redo_op').blur() 
                   }
           }
        ]);
});
