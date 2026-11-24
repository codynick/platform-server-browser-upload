
// Convert legacy inline number fields to replaceable numeric shadows on JSON import.
(() => {
 const B=window.Blockly,slots={"cn_rgb_matrix_set": ["led"], "cn_rgb_matrix_set_xy": ["x", "y"], "cn_led_matrix_set_pixel": ["x", "y"], "cn_led_matrix_on": ["x", "y"], "cn_led_matrix_off": ["x", "y"], "cn_sound_play": ["duration_ms"], "cn_sound_play_until_done": ["duration_ms"], "cn_seven_segment_display": ["value"]},defaults={"cn_led_matrix_set_pixel": {"x": 0.0, "y": 0.0}, "cn_led_matrix_on": {"x": 0.0, "y": 0.0}, "cn_led_matrix_off": {"x": 0.0, "y": 0.0}, "cn_rgb_matrix_set": {"led": 0.0}, "cn_rgb_matrix_set_xy": {"x": 0.0, "y": 0.0}, "cn_sound_play": {"duration_ms": 500.0}, "cn_sound_play_until_done": {"duration_ms": 500.0}, "cn_seven_segment_display": {"value": 123.0}};
 function migrate(value){
  if(!value||typeof value!=='object')return;
  if(value.type==='cn_seven_segment_display_value'){
   value.inputs=value.inputs||{};
   const old=value.inputs.value,hasField=value.fields&&Object.hasOwn(value.fields,'value');
   if(!old?.block&&!old?.shadow)value.inputs.value={shadow:{type:'text',fields:{TEXT:hasField?String(value.fields.value):'feed'}}};
   else if(!old.block&&old.shadow?.type==='math_number')old.shadow={type:'text',fields:{TEXT:String(old.shadow.fields?.NUM??0)}};
   if(hasField)delete value.fields.value;
  }
  for(const name of slots[value.type]||[]){
   value.inputs=value.inputs||{};
   const hasField=value.fields&&Object.hasOwn(value.fields,name);
   if(!value.inputs[name]?.block&&!value.inputs[name]?.shadow)value.inputs[name]={shadow:{type:'math_number',fields:{NUM:hasField?Number(value.fields[name]):defaults[value.type][name]}}};
   if(hasField)delete value.fields[name];
  }
  for(const child of Object.values(value))migrate(child);
 }
 for(const [owner,key] of [[B.serialization.workspaces,'load'],[B.serialization.blocks,'append']]){
  const original=owner[key];
  owner[key]=function(state,...args){const copy=JSON.parse(JSON.stringify(state));migrate(copy);return original.call(this,copy,...args);};
 }
})();
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
