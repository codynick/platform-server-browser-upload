/* Original project Python generator, retained as a reference preview only. Run uses Web Serial. */
const workspace=window.codyWorkspace;
const dynamicBlockSpecs=new Map(window.HARDWARE_SPECS.map(s=>[s.type,s]));
const SpritePrototype={value:()=>null,statement:()=>null};

const ExecutionTarget={programBlocks:ws=>ws.getAllBlocks(false).filter(b=>dynamicBlockSpecs.has(b.type)),initialization:()=> 'cody = CN()'};
function quotePython(value) {
  return JSON.stringify(String(value ?? ''));
}

function safeName(name) {
  return String(name || 'variable')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/^[^A-Za-z_]+/, '') || 'variable';
}

function variableName(block, fieldName) {
  const id = block.getFieldValue(fieldName);
  const variable = block.workspace.getVariableMap().getVariableById(id);
  return safeName(variable ? variable.name : id);
}

function fieldPythonValue(arg, value) {
  if (arg.kind === 'number') {
    const n = Number(value);
    return Number.isFinite(n) ? String(n) : '0';
  }

  if (arg.kind === 'dropdown') {
    return String(value);
  }

  if (arg.kind === 'colour') {
    return quotePython(value);
  }

  return quotePython(value);
}

function blockFieldValue(block, arg) {
  return block.getFieldValue(arg.name);
}

function indent(code, spaces = 4) {
  const pad = ' '.repeat(spaces);
  const lines = String(code || '').split('\n');
  const out = lines
    .filter(line => line.length > 0)
    .map(line => pad + line)
    .join('\n');
  return out ? out + '\n' : '';
}

function statementToCode(block, inputName) {
  const target = block.getInputTargetBlock(inputName);
  return stackToCode(target);
}

function valueToCode(block, inputName, fallback = 'None') {
  const target = block.getInputTargetBlock(inputName);
  if (!target) return fallback;
  return blockToPythonValue(target);
}

function stackToCode(block) {
  let code = '';
  let cursor = block;

  while (cursor) {
    code += blockToPythonStatement(cursor);
    cursor = cursor.getNextBlock();
  }

  return code;
}

function blockToPythonValue(block) {
  if (!block) return 'None';
  const spriteValue = SpritePrototype.value(block);
  if (spriteValue !== null) return spriteValue;
  if (block.type === 'cn_timer_value') return '(time.monotonic() - _codynick_timer_start)';

  if (dynamicBlockSpecs.has(block.type)) {
    return renderDynamicBlock(block);
  }

  switch (block.type) {
    case 'cn_scalar_value': {
      const value=window.CodyEditorInputs.parseScalar(block.getFieldValue('VALUE'));
      return typeof value==='number'?String(value):quotePython(value);
    }

    case 'math_number':
      return String(Number(block.getFieldValue('NUM') || 0));

    case 'text':
      return quotePython(block.getFieldValue('TEXT') || '');

    case 'logic_boolean':
      return block.getFieldValue('BOOL') === 'TRUE' ? 'True' : 'False';

    case 'logic_negate':
      return '(not ' + valueToCode(block, 'BOOL', 'False') + ')';

    case 'logic_operation': {
      const op = block.getFieldValue('OP') === 'AND' ? 'and' : 'or';
      return '(' + valueToCode(block, 'A', 'False') + ' ' + op + ' ' + valueToCode(block, 'B', 'False') + ')';
    }

    case 'logic_compare': {
      const opMap = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
      const op = opMap[block.getFieldValue('OP')] || '==';
      return '(' + valueToCode(block, 'A', '0') + ' ' + op + ' ' + valueToCode(block, 'B', '0') + ')';
    }

    case 'math_arithmetic': {
      const opMap = { ADD: '+', MINUS: '-', MULTIPLY: '*', DIVIDE: '/', POWER: '**' };
      const op = opMap[block.getFieldValue('OP')] || '+';
      return '(' + valueToCode(block, 'A', '0') + ' ' + op + ' ' + valueToCode(block, 'B', '0') + ')';
    }

    case 'math_single': {
      const op = block.getFieldValue('OP');
      const n = valueToCode(block, 'NUM', '0');
      if (op === 'NEG') return '(-' + n + ')';
      if (op === 'ABS') return 'abs(' + n + ')';
      if (op === 'ROOT') return '(' + n + ' ** 0.5)';
      return n;
    }

    case 'math_round': {
      const op = block.getFieldValue('OP');
      const n = valueToCode(block, 'NUM', '0');
      if (op === 'ROUND') return 'round(' + n + ')';
      if (op === 'ROUNDUP') return '__import__("math").ceil(' + n + ')';
      if (op === 'ROUNDDOWN') return '__import__("math").floor(' + n + ')';
      return 'round(' + n + ')';
    }

    case 'math_random_int':
      return '__import__("random").randint(int(' + valueToCode(block, 'FROM', '1') + '), int(' + valueToCode(block, 'TO', '10') + '))';

    case 'variables_get':
      return variableName(block, 'VAR');

    case 'text_join': {
      const itemCount = block.itemCount_ || 2;
      const parts = [];
      for (let i = 0; i < itemCount; i++) {
        parts.push('str(' + valueToCode(block, 'ADD' + i, "''") + ')');
      }
      return '(' + parts.join(' + ') + ')';
    }

    default:
      return 'None';
  }
}

function blockToPythonStatement(block) {
  if (!block) return '';
  const dashboardStatement = DashboardBlocks.statement(block, valueToCode);
  if (dashboardStatement !== null) return dashboardStatement;
  const spriteStatement = SpritePrototype.statement(block, valueToCode);
  if (spriteStatement !== null) return spriteStatement;
  if (block.type === 'cn_timer_reset') return '_codynick_timer_start = time.monotonic()\n';

  if (dynamicBlockSpecs.has(block.type)) {
    const spec = dynamicBlockSpecs.get(block.type);
    const expr = renderDynamicBlock(block);
    if (spec.output) {
      return expr + '\n';
    }
    return expr + '\n';
  }

  switch (block.type) {
    case 'text_print':
      return 'print(' + valueToCode(block, 'TEXT', "''") + ')\n';

    case 'cn_wait':
      return 'time.sleep(max(0, ' + valueToCode(block, 'SECONDS', '1') + '))\n';

    case 'cn_forever':
      return 'while True:\n' + indent(statementToCode(block, 'DO') + 'time.sleep(0.01)\n');

    case 'variables_set':
      return variableName(block, 'VAR') + ' = ' + valueToCode(block, 'VALUE', 'None') + '\n';

    case 'controls_if': {
      let code = '';
      const ifCount = 1 + (block.elseifCount_ || 0);
      for (let i = 0; i < ifCount; i++) {
        const keyword = i === 0 ? 'if' : 'elif';
        const condition = valueToCode(block, 'IF' + i, 'False');
        const body = statementToCode(block, 'DO' + i) || 'pass\n';
        code += keyword + ' ' + condition + ':\n' + indent(body);
      }
      if (block.elseCount_) {
        const body = statementToCode(block, 'ELSE') || 'pass\n';
        code += 'else:\n' + indent(body);
      }
      return code;
    }

    case 'controls_repeat_ext': {
      const times = valueToCode(block, 'TIMES', '10');
      const body = statementToCode(block, 'DO') || 'pass\n';
      return 'for _ in range(int(' + times + ')):\n' + indent(body);
    }

    case 'controls_whileUntil': {
      const until = block.getFieldValue('MODE') === 'UNTIL';
      const cond = valueToCode(block, 'BOOL', 'False');
      const body = statementToCode(block, 'DO') || 'pass\n';
      return 'while ' + (until ? '(not ' + cond + ')' : cond) + ':\n' + indent(body + 'time.sleep(0.01)\n');
    }

    case 'controls_flow_statements':
      return block.getFieldValue('FLOW') === 'BREAK' ? 'break\n' : 'continue\n';

    case 'cn_event_start':
    case 'cn_event_loop':
      return statementToCode(block, 'DO');

    default:
      return '# Unsupported statement block: ' + block.type + '\n';
  }
}

function renderDynamicBlock(block) {
  const spec = dynamicBlockSpecs.get(block.type);
  let code = String(spec.python || '');

  for (const arg of (spec.args || [])) {
    if (arg.kind === 'value') {
      code = code.replaceAll('{' + arg.name + '}', valueToCode(block, arg.name, '0'));
      continue;
    }
    const raw = blockFieldValue(block, arg);
    const value = block.type.startsWith('cn_df_') && arg.kind === 'dropdown' ? quotePython(raw) : fieldPythonValue(arg, raw);
    code = code.replaceAll('{' + arg.name + '}', value);
  }

  return code;
}

function generatePython() {
  const allBlocks = workspace.getAllBlocks(false);
  const usesStage = allBlocks.some(block => block.type.startsWith('sprite_'));
  const topBlocks = workspace.getTopBlocks(true);
  const startBlocks = topBlocks.filter(b => b.type === 'cn_event_start');
  const loopBlocks = topBlocks.filter(b => b.type === 'cn_event_loop');
  const gadgetBlocks = ExecutionTarget.programBlocks(workspace, dynamicBlockSpecs);
  const usesHardware = gadgetBlocks.length > 0;
  const usesDashboard = [...startBlocks, ...loopBlocks].some(root => root.getDescendants(false).some(block => block.type.startsWith('dash_')));

  let startCode = '';
  for (const b of startBlocks) {
    startCode += statementToCode(b, 'DO');
  }

  let loopCode = '';
  for (const b of loopBlocks) {
    loopCode += statementToCode(b, 'DO');
  }

  if (!startCode.trim()) startCode = 'pass\n';
  if (!loopCode.trim()) loopCode = 'time.sleep(0.05)\n';
  else loopCode += 'time.sleep(0.05)\n';

  return [
    '# Auto-generated by CodyNick Blockly IDE',
    '# Reference preview only. The Run button executes blocks in this browser using Web Serial.',
    '# Do not edit manually if you plan to regenerate it from blocks.',
    '',
    'import time',
    usesDashboard ? DashboardBlocks.initialization() : '',
    'from CodyNick import *',
    usesStage ? 'from SpriteStage import SpriteStage' : '',
    '',
    allBlocks.some(b=>b.type==='cn_seven_segment_display_value') ? "def __cn_seven_reading(cody, device, value):\n    if not isinstance(value, str):\n        return Seven_Segment.display(cody, device, value)\n    index = {'STANDALONE': 0, 'ULTRASEG': 2, '0': 0, '2': 2}.get(str(device).upper())\n    if index is None:\n        raise ValueError('Display device must be 0 or 2')\n    text = value[:4]\n    if any(ord(c) < 32 or ord(c) > 126 for c in text):\n        raise ValueError('Display text must use printable ASCII characters')\n    if cody is not None and cody.ensure_connected():\n        cody.ser.send_line('CN@@7TXT@@%02d%s____' % (index, text.ljust(4)), add_newline=False)\n        time.sleep(0.06)\n" : '',
    allBlocks.some(b=>['cn_rgb_led_code','cn_rgb_led_xy_code','cn_rgb_led_percent'].includes(b.type)) ? "def __cn_rgb_code(code):\n    value = float(code)\n    if not (0 <= value <= 7) or value != int(value):\n        raise ValueError('Color code must be an integer from 0 to 7')\n    return ['#FF0000', '#00FFFF', '#0000FF', '#FFFF00', '#FF00FF', '#00FF00', '#FF8000', '#FFFFFF'][int(value)]\n\ndef __cn_rgb_percent(red, green, blue):\n    channels = [float(red), float(green), float(blue)]\n    if any(not (0 <= value <= 100) for value in channels):\n        raise ValueError('RGB percentages must be between 0 and 100')\n    return '#' + ''.join('%02X' % int(value * 255 / 100 + 0.5) for value in channels)\n" : '',
    allBlocks.some(b=>b.type.startsWith('cn_df_')) ? "def __cn_df_call(cody, block, args):\n    import math\n    if cody is None or not cody.ensure_connected():\n        raise RuntimeError('Connect a CJP for DFPlayer')\n    ser = cody.ser.ser\n\n    def request(frame, prefix):\n        old_timeout = ser.timeout\n        try:\n            ser.reset_input_buffer()\n            ser.timeout = 0.05\n            ser.write(frame.encode('ascii').ljust(20, b'_'))\n            ser.flush()\n            data = b''\n            deadline = time.monotonic() + 2.5\n            head = prefix.encode('ascii')\n            while time.monotonic() < deadline:\n                data = (data + ser.read(20))[-1024:]\n                start = data.find(head)\n                if start >= 0 and len(data) >= start + 20:\n                    raw = data[start+len(head):start+20].rstrip(b'_').decode('ascii')\n                    if raw == 'ERR':\n                        raise RuntimeError('DFPlayer is unavailable')\n                    return raw\n            raise RuntimeError('No DFPlayer reply')\n        finally:\n            ser.timeout = old_timeout\n\n    def write(packet):\n        frame = 'CN@@DF@@W' + str(len(packet)) + ''.join('%02X' % x for x in packet)\n        if request(frame, 'CN@@DF@@') != 'OK':\n            raise RuntimeError('DFPlayer command failed')\n\n    def busy():\n        value = request('CN@@DF@@B', 'CN@@DF@@B')\n        if value not in ('0', '1'):\n            raise ValueError('Invalid DFPlayer busy reply')\n        return value == '1'\n\n    def wait_done(timeout):\n        begin = time.monotonic()\n        seen = False\n        while True:\n            elapsed = time.monotonic() - begin\n            if timeout and elapsed >= timeout:\n                return False\n            active = busy()\n            if active:\n                seen = True\n            elif seen:\n                return True\n            elif elapsed >= 2:\n                return False\n            time.sleep(0.06)\n\n    def numeric(value, lo, hi, integer=False):\n        value = float(value)\n        if not math.isfinite(value) or not lo <= value <= hi or (integer and int(value) != value):\n            raise ValueError('DFPlayer input outside supported range')\n        return int(value) if integer else value\n\n    def find(values, value):\n        for index, name in enumerate(values):\n            if name.lower() == str(value).lower():\n                return index\n        raise ValueError('Unknown DFPlayer menu value')\n\n    menus = {'phrases': ['Hello', 'Welcome', 'Good morning', 'Good bye', 'Warning', 'Keep away', 'Up', 'Down', 'Left', 'Right', 'Open', 'Close', 'Ok', 'Click', 'Open the tap', 'Close the tap', 'Tap is open', 'Tap is closed', 'Thief Thief', \"There's a thief in the house\", 'Fire', 'Smoke', 'Humidity', 'Temperature', 'Soil Moisture', 'Parking Capacity', 'Was', 'Is', 'A little', 'A lot', 'Give me water', 'Please give me water', 'Can you give me water', \"I'm thirsty\", 'I am quenched', \"I'm full\", 'Water consumption is high', 'Hurry up', \"It's time to go\", 'Welcome to school', 'How are you athlete', 'Welcome footballer'], 'persian': ['\u0633\u0644\u0627\u0645', '\u0628\u0627\u0644\u0627', '\u0686\u067e', '\u0631\u0627\u0633\u062a', '\u067e\u0627\u06cc\u06cc\u0646', '\u06a9\u0644\u06cc\u06a9', '\u062e\u0648\u0634 \u0622\u0645\u062f\u06cc\u062f', '\u0646\u0632\u062f\u06cc\u06a9 \u0646\u0634\u0648', '\u062e\u062f\u0627 \u0646\u06af\u0647\u062f\u0627\u0631', '\u0647\u0634\u062f\u0627\u0631', '\u062f\u0632\u062f', '\u0635\u0627\u062d\u0628 \u062e\u0627\u0646\u0647 \u062f\u0632\u062f', '\u0622\u062a\u06cc\u0634', '\u062f\u0648\u062f', '\u0631\u0637\u0648\u0628\u062a', '\u062f\u0645\u0627', '\u0631\u0637\u0648\u0628\u062a \u062e\u0627\u06a9', '\u0638\u0631\u0641\u06cc\u062a \u067e\u0627\u0631\u06a9\u06cc\u0646\u06af', '\u0645\u06cc\\u200c\u0628\u0627\u0634\u062f', '\u0627\u0633\u062a', '\u06a9\u0645', '\u0632\u06cc\u0627\u062f', '\u0628\u0647 \u0645\u0646 \u0622\u0628 \u062f\u0647\u06cc\u062f', '\u062a\u0634\u0646\u0647 \u0627\u0645', '\u0648\u0627\u06cc \u062a\u0634\u0646\u0645\u0647 ( \u0632\u0646 )', '\u0648\u0627\u06cc \u062a\u0634\u0646\u0645\u0647 ( \u0645\u0631\u062f )', '\u0633\u06cc\u0631\u0627\u0628 \u0634\u062f\u0645 ( \u0632\u0646 )', '\u0633\u06cc\u0631\u0627\u0628 \u0634\u062f\u0645 ( \u0645\u0631\u062f )', '\u0644\u0637\u0641\u0627 \u0628\u0647 \u0645\u0646 \u0622\u0628 \u0628\u062f\u06cc\u062f.( \u0632\u0646 )', '\u0644\u0637\u0641\u0627 \u0628\u0647 \u0645\u0646 \u0622\u0628 \u0628\u062f\u06cc\u062f.( \u0645\u0631\u062f )', '\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0645\u0646 \u0622\u0628 \u0628\u062f\u06cc\u062f \u061f ( \u0632\u0646 )', '\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0645\u0646 \u0622\u0628 \u0628\u062f\u06cc\u062f \u061f ( \u0645\u0631\u062f )', '\u0628\u0634\u062a\u0627\u0628\u06cc\u062f \u0628\u0633\u0648\u06cc \u0646\u0645\u0627\u0632', '\u0628\u0647 \u0645\u062f\u0631\u0633\u0647 \u062e\u0648\u0634 \u0622\u0645\u062f\u06cc', '\u0686\u0637\u0648\u0631\u06cc \u0648\u0631\u0632\u0634\u06a9\u0627\u0631', '\u062e\u0648\u0634 \u0627\u0648\u0645\u062f\u06cc \u0641\u0648\u062a\u0628\u0627\u0644\u06cc\u0633\u062a', '\u0634\u06cc\u0631 \u0622\u0628 \u0628\u0627\u0632\u0647', '\u0634\u06cc\u0631 \u0622\u0628 \u0631\u0627 \u0628\u0628\u0646\u062f\u06cc\u062f', '\u0635\u0628\u062d \u0634\u0645\u0627 \u0628\u062e\u06cc\u0631', '\u0645\u0635\u0631\u0641 \u0622\u0628 \u0628\u0627\u0644\u0627\u0633\u062a', '\u0648\u0642\u062a \u0646\u0645\u0627\u0632 \u0627\u0633\u062a', '\u062f\u0632\u062f [track 42]', '\u0622\u062a\u06cc\u0634 [track 43]']}\n    actions = ['mute', 'unmute', 'volume_up', 'volume_down', 'stop', 'next', 'previous', 'pause', 'resume', 'repeat_track', 'repeat_track_off', 'repeat_all', 'repeat_all_off', 'shuffle']\n    if block == 'cn_df_busy':\n        return busy()\n    if block == 'cn_df_wait':\n        return wait_done(numeric(args.get('timeout', 0), 0, 86400))\n    if block == 'cn_df_volume':\n        write([0xA0 + int(numeric(args['volume'], 0, 100) * 3 / 10)])\n        return\n    if block == 'cn_df_control':\n        write([0x47, find(actions, args['action']), 0, 0])\n        return\n    until = block.endswith('_wait')\n    if until:\n        block = block[:-5]\n    languages = {'Arabic': (9, 13), 'English': (10, 14), 'German': (11, 15), 'French': (17, 18)}\n    language = args.get('language', 'English')\n    language = 'German' if language == 'Deutsch' else language\n    if language not in languages:\n        raise ValueError('Unknown DFPlayer language')\n    timeout = 10\n    if block == 'cn_df_phrase':\n        packet = [languages[language][0], find(menus['phrases'], args['phrase']) + 1]\n    elif block == 'cn_df_persian':\n        packet = [2, find(menus['persian'], args['phrase']) + 1]\n    elif block == 'cn_df_emotion':\n        packet = [1, find(['Happy', 'Sad', 'Angry', 'Surprise', 'Neutral'], args['emotion']) + 15]\n        timeout = 60\n    elif block == 'cn_df_whole':\n        value = numeric(args['value'], 0, 100, True)\n        packet = [5, value] if value else [5, 0, 0, 0, 0]\n    elif block == 'cn_df_number':\n        value = numeric(args['value'], -21474836.47, 21474836.47)\n        cents = int(math.floor(abs(value) * 100 + 0.5)) * (-1 if value < 0 else 1)\n        if abs(cents) > 2147483647:\n            raise ValueError('Number exceeds signed hundredths range')\n        packet = [languages[language][1]] + list(cents.to_bytes(4, 'big', signed=True))\n        timeout = 18\n    elif block == 'cn_df_track':\n        mode = args.get('mode', 'standard')\n        if mode not in ('standard', 'large'):\n            raise ValueError('Unknown DFPlayer track mode')\n        large = mode == 'large'\n        folder = numeric(args['folder'], 1, 10 if large else 99, True)\n        track = numeric(args['track'], 1, 1000 if large else 255, True)\n        packet = [folder, track & 255, track >> 8] if large else [folder, track]\n        timeout = 12 if large else 10\n    else:\n        raise ValueError('Unsupported DFPlayer block')\n    write(packet)\n    if until:\n        if not wait_done(numeric(args.get('timeout', timeout), 0, 86400)):\n            raise RuntimeError('DFPlayer did not start or timed out')\n        return True\n" : '',
    allBlocks.some(b=>b.type.startsWith('cn_air_')) ? "def __cn_air_read(cody, kind):\n    if cody is None or not cody.ensure_connected():\n        raise RuntimeError('Connect a CJP for Air Temp/Hum')\n    prefix = b'CN@@AIRH@@' if kind == 'humidity' else b'CN@@AIRT@@'\n    ser = cody.ser.ser\n    old_timeout = ser.timeout\n    try:\n        ser.reset_input_buffer()\n        ser.timeout = 0.05\n        ser.write(prefix.ljust(20, b'_'))\n        ser.flush()\n        data = b''\n        deadline = time.monotonic() + 2.5\n        while time.monotonic() < deadline:\n            data += ser.read(20)\n            start = data.find(prefix)\n            if start >= 0 and len(data) >= start + 20:\n                raw = data[start+10:start+20].rstrip(b'_').decode('ascii')\n                if raw == 'ERR':\n                    raise RuntimeError('Air Temp/Hum is unavailable')\n                value = float(raw)\n                if not ((0 <= value <= 100) if kind == 'humidity' else (-55 <= value <= 125)):\n                    raise ValueError('Invalid Air Temp/Hum reading')\n                return value\n        raise RuntimeError('No Air Temp/Hum reply')\n    finally:\n        ser.timeout = old_timeout\n" : '',
    allBlocks.some(b=>b.type==='cn_light_read') ? "def __cn_light_percent(cody):\n    if cody is None or not cody.ensure_connected():\n        raise RuntimeError('Connect a CJP for the light sensor')\n    ser = cody.ser.ser\n    old_timeout = ser.timeout\n    try:\n        ser.reset_input_buffer()\n        ser.timeout = 0.05\n        ser.write(b'CN@@LIGHT@@'.ljust(20, b'_'))\n        ser.flush()\n        deadline = time.monotonic() + 2.5\n        data = b''\n        while time.monotonic() < deadline:\n            data += ser.read(20)\n            start = data.find(b'CN@@LIGHT@@')\n            if start >= 0 and len(data) >= start + 20:\n                raw = data[start+11:start+20].rstrip(b'_').decode('ascii')\n                if raw == 'ERR':\n                    raise RuntimeError('Light sensor is unavailable. Check its connection.')\n                value = float(raw)\n                if not (0 <= value <= 100):\n                    raise ValueError('Invalid light intensity reading')\n                return value\n        raise RuntimeError('No light sensor reply')\n    finally:\n        ser.timeout = old_timeout\n" : '',
    '_codynick_timer_start = time.monotonic()',
    usesStage ? SpritePrototype.initialization() : '',
    usesHardware ? ExecutionTarget.initialization(gadgetBlocks) : 'cody = None',
    '',
    'try:',
    indent('# When CodyNick starts'),
    indent(startCode),
    indent('# Main Loop'),
    indent('while True:\n' + indent(loopCode)),
    'except KeyboardInterrupt:',
    '    pass',
    'finally:',
    '    try:',
    '        cody.close()',
    '    except Exception:',
    '        pass',
    ''
  ].join('\n');
}

function viewPython() {
  const mixed=workspace.getAllBlocks(false).some(b=>b.getFieldValue('TARGET')==='SIMULATION'||b.type.startsWith('dash_')||b.type.startsWith('stage_')||b.type.startsWith('ai_'));
  const code = mixed?'# This Live program uses browser AI/sprites/simulation/dashboard targets.\n# A single Python hardware script cannot represent its routing.\n# Run the blocks using the Live runtime.':updatePythonPreview(true);
  document.getElementById('pythonPreview').textContent = code;
  document.getElementById('pythonModal').classList.add('open');
}

function closePythonModal(event) {
  if (event) {
    event.stopPropagation();
    const modal = document.querySelector('#pythonModal .modal');
    const clickedBackdrop = event.target && event.target.id === 'pythonModal';
    const clickedButton = event.target && event.target.closest('button');
    if (modal && modal.contains(event.target) && !clickedButton) return;
    if (!clickedBackdrop && !clickedButton) return;
  }
  document.getElementById('pythonModal').classList.remove('open');
}

async function copyPythonPreview(event) {
  if (event) event.stopPropagation();
  const code = document.getElementById('pythonPreview').textContent;
  await navigator.clipboard.writeText(code);
  window.portalToast?.('Python copied.');
}


function updatePythonPreview(){return generatePython();}
