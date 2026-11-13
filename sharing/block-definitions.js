'use strict';
const B=window.Blockly,specs=window.HARDWARE_SPECS;
const Blockly=B;
function buildDynamicBlockJson(spec) {
  const args0 = [];
  for (const arg of (spec.args || [])) {
    if (arg.kind === 'value') {
      args0.push({type: 'input_value', name: arg.name, check: arg.check || null});
    } else if (arg.kind === 'number') {
      args0.push({
        type: 'field_number',
        name: arg.name,
        value: Number(arg.default ?? 0)
      });
    } else if (arg.kind === 'dropdown') {
      args0.push({
        type: 'field_dropdown',
        name: arg.name,
        options: arg.options || [['value', String(arg.default ?? '')]]
      });
    } else if (arg.kind === 'colour') {
      // Use Blockly's color picker only when FieldColour exists.
      // Otherwise use a normal dropdown so older/newer Blockly bundles do not crash.
      if (Blockly.FieldColour) {
        args0.push({
          type: 'field_colour',
          name: arg.name,
          colour: arg.default || '#4c97ff'
        });
      } else {
        args0.push({
          type: 'field_dropdown',
          name: arg.name,
          options: [
            ['red', '#FF0000'],
            ['cyan', '#00FFFF'],
            ['blue', '#0000FF'],
            ['yellow', '#FFFF00'],
            ['magenta', '#FF00FF'],
            ['green', '#00FF00'],
            ['orange', '#FF8000'],
            ['white', '#FFFFFF']
          ]
        });
      }
    } else {
      args0.push({
        type: 'field_input',
        name: arg.name,
        text: String(arg.default ?? '')
      });
    }
  }

  if(spec.type!=='cn_log')args0.push({type:'field_dropdown',name:'TARGET',options:[['Hardware','HARDWARE'],['Simulation','SIMULATION']]});
  const json = {
    type: spec.type,
    message0: spec.label+(spec.type==='cn_log'?'':' target %'+args0.length),
    inputsInline: true,
    args0,
    colour: spec.colour || '#4c97ff',
    tooltip: spec.tooltip || '',
    helpUrl: ''
  };

  if (spec.output) {
    json.output = spec.output;
  } else {
    json.previousStatement = null;
    json.nextStatement = null;
  }

  return json;
}

function defineEventBlocks() {
  Blockly.Blocks['cn_event_start'] = {
    init: function() {
      this.appendDummyInput().appendField('when CodyNick starts');
      this.hat = 'cap';
      this.appendStatementInput('DO');
      this.setColour('#ffbf00');
      this.setTooltip('Runs once when the generated Python program starts.');
      this.setDeletable(true);
    }
  };

  Blockly.Blocks['cn_event_loop'] = {
    init: function() {
      this.appendDummyInput().appendField('main loop');
      this.hat = 'cap';
      this.appendStatementInput('DO');
      this.setColour('#ffab19');
      this.setTooltip('Blocks here are generated inside while True.');
      this.setDeletable(true);
    }
  };
}


B.defineBlocksWithJsonArray(specs.map(buildDynamicBlockJson));
DashboardBlocks.definitions();
window.CodySpriteBlocks?.definitions();
defineEventBlocks();
B.defineBlocksWithJsonArray([
{type:'cn_wait',message0:'wait %1 seconds',args0:[{type:'input_value',name:'SECONDS',check:'Number'}],previousStatement:null,nextStatement:null,colour:'#ffab19'},
{type:'cn_forever',message0:'forever %1',args0:[{type:'input_statement',name:'DO'}],previousStatement:null,colour:'#ffab19'},
{type:'cn_timer_value',message0:'timer (seconds)',output:'Number',colour:'#00838f'},
{type:'cn_timer_reset',message0:'reset timer',previousStatement:null,nextStatement:null,colour:'#00838f'}]);

window.CodyAIBlocks.definitions();
