import json,pathlib,tempfile,unittest
from urllib.parse import urlsplit,parse_qs
import configure

class Tests(unittest.TestCase):
 def test_urls_preserve_settings(self):
  with tempfile.TemporaryDirectory() as temp:
   path=pathlib.Path(temp)/'config.json';path.write_text(json.dumps({'CAS_BASE_URL':'https://id.codynick.com/cas','CAS_VALIDATE_URL':'https://id.codynick.com/cas/p3/serviceValidate','CAS_ID_ATTRIBUTE':'uid','CAS_LOGOUT_URL':'https://id.codynick.com/custom/logout?keep=yes&service=https://old.example/blocks/'}))
   for domain in ['ide.codynick.com','another.example']:
    c=configure.configure(domain,path);self.assertEqual(c['CAS_ID_ATTRIBUTE'],'uid');self.assertEqual(c['PUBLIC_ORIGIN'],'https://'+domain);q=parse_qs(urlsplit(c['CAS_LOGOUT_URL']).query);self.assertEqual(q['service'],['https://'+domain+'/blocks/']);self.assertEqual(q['keep'],['yes']);before=path.read_text();configure.configure(domain,path);self.assertEqual(path.read_text(),before)
 def test_apache_idempotence_and_restore(self):
  text='<VirtualHost *:443>\n ServerName ide.codynick.com\n CustomLog /var/log/apache2/site.log combined\n</VirtualHost>\n<VirtualHost *:443>\n ServerName other.example\n CustomLog /var/log/apache2/other.log combined\n</VirtualHost>\n'
  changed,found=configure.patch_apache(text,'ide.codynick.com');self.assertTrue(found);self.assertIn('site.log codynick_private',changed);self.assertIn('other.log combined',changed);self.assertEqual(configure.patch_apache(changed,'ide.codynick.com')[0],changed)
  with tempfile.TemporaryDirectory() as temp:
   root=pathlib.Path(temp);sites=root/'enabled';sites.mkdir();site=sites/'portal.conf';site.write_text(text);backup=root/'backup';backup.mkdir();configure.apache('ide.codynick.com',backup,sites,True);self.assertEqual(site.read_text(),changed);configure.restore(backup);self.assertEqual(site.read_text(),text)
 def test_old_patch_replacement(self):
  text='<VirtualHost *:443>\n ServerName ide.codynick.com\n # CodyNick CAS integration\n ProxyPass /api/ http://127.0.0.1:8791/api/\n <FilesMatch "x">\n </FilesMatch>\n <Location "/auth/confirm">\n </Location>\n</VirtualHost>\n';new,_=configure.patch_apache(text,'ide.codynick.com');self.assertEqual(new.count('ProxyPass /api/'),1);self.assertEqual(new.count('<Location "/auth/confirm">'),1)
if __name__=='__main__':unittest.main()
