"""Validate installer apt arguments without running apt or changing the host."""
import os
import pathlib
import re
import shutil
import subprocess
import unittest

SOURCE = pathlib.Path(__file__).resolve().parents[1]

def find_bash():
    if os.environ.get('BASH'):
        return os.environ['BASH']
    if os.name == 'nt':
        candidate = pathlib.Path('C:/Program Files/Git/bin/bash.exe')
        if candidate.is_file():
            return str(candidate)
    return shutil.which('bash')

class AptLockWaitTests(unittest.TestCase):
    def test_setup_and_cas_pass_timeout_to_every_apt_operation(self):
        bash = find_bash()
        if not bash:
            self.skipTest('Bash is required for the mocked apt invocation')
        for name, count in [('setup.sh', 3), ('cas/update.sh', 2)]:
            text = (SOURCE / name).read_text(encoding='utf-8')
            commands = re.findall(r'^\s*(apt-get\s+[^\n]+)', text, re.M)
            self.assertEqual(len(commands), count, name)
            for command in commands:
                with self.subTest(script=name, command=command):
                    # Shell function shadows apt-get; capture its exact argv only.
                    result = subprocess.run(
                        [bash, '-c', "apt-get() { printf '%s\\0' \"$@\"; }; " + command],
                        capture_output=True, check=True)
                    args = result.stdout.decode().split('\0')[:-1]
                    self.assertEqual(args[:2], ['-o', 'DPkg::Lock::Timeout=600'])
                    self.assertIn(args[2], ['update', 'install'])
                    if args[2] == 'install':
                        self.assertEqual(args[3], '-y')

    def test_branding_assets_are_required_deployed_and_rolled_back(self):
        for script, prefix in [('setup.sh', 'for required in '), ('install.sh', 'for name in ')]:
            text = (SOURCE / script).read_text(encoding='utf-8')
            required = next(line for line in text.splitlines() if line.startswith(prefix))
            for name in ['blocks/editor-interactions.js', 'blocks/block-icons.js', 'assets/codynick-block-icon.png']:
                self.assertIn(name, required)
                self.assertTrue((SOURCE / name).is_file())
        for script in ['install.sh', 'rollback.sh']:
            text = (SOURCE / script).read_text(encoding='utf-8')
            assets = re.search(r'for name in (tool-navigation\.css[^;]+); do', text)
            self.assertIsNotNone(assets)
            self.assertIn('codynick-block-icon.png', assets[1].split())

if __name__ == '__main__':
    unittest.main(verbosity=2)
