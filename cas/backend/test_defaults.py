import unittest,json
from unittest.mock import patch
import test_app
m=test_app.m

class DefaultsTests(unittest.TestCase):
    def setUp(self):
        test_app.Tests.setUp(self)
        self.headers=test_app.Tests.user(self,self.client,'admin')
        with m.database() as db:db.execute("INSERT INTO account_access(user_id,role) VALUES('admin','admin')")

    def call(self,method,path,**kwargs):return getattr(self.client,method)(path,base_url=m.ORIGIN,**kwargs)
    def save(self,seconds=13,cooldown=2,revision=None):
        if revision is None:revision=m.runtime_defaults()['revision']
        return self.call('put','/api/admin/defaults',headers=self.headers,json=dict(seconds=seconds,cooldown=cooldown,revision=revision))

    def test_admin_auth_csrf_validation_and_conflict(self):
        guest=m.app.test_client()
        self.assertEqual(guest.get('/api/admin/defaults',base_url=m.ORIGIN).status_code,401)
        other=m.app.test_client();headers=test_app.Tests.user(self,other,'student')
        self.assertEqual(other.get('/api/admin/defaults',base_url=m.ORIGIN).status_code,403)
        self.assertEqual(other.put('/api/admin/defaults',base_url=m.ORIGIN,headers=headers,json={}).status_code,403)
        self.assertEqual(self.call('put','/api/admin/defaults',json={}).status_code,403)
        for seconds,cooldown in [(0,2),(86401,2),(True,2),(1.5,2),(10,-1),(10,86401),(10,False)]:self.assertEqual(self.save(seconds,cooldown).status_code,400)
        self.assertEqual(self.save(revision=0).status_code,409)
        self.assertEqual(self.save().status_code,200)
        self.assertEqual(self.save(revision=1).status_code,409)

    def test_guest_and_inheriting_user_receive_new_limits(self):
        self.save()
        with patch.object(m.time,'time',return_value=1000):
            guest=m.app.test_client();run=guest.post('/api/run/start',base_url=m.ORIGIN,headers={'Origin':m.ORIGIN},json={})
            self.assertEqual(run.json['deadline'],1013);self.assertEqual(run.json['ready'],1015)
            student=m.app.test_client();headers=test_app.Tests.user(self,student,'student')
            result=student.post('/api/run/start',base_url=m.ORIGIN,headers=headers,json={})
            self.assertEqual(result.json['deadline'],1013);self.assertEqual(result.json['ready'],1015)
        access=m.access_for('student');self.assertTrue(access['uses_default_seconds']);self.assertTrue(access['uses_default_cooldown'])

    def test_custom_limits_and_unlimited_access_are_preserved(self):
        with m.database() as db:
            db.execute("INSERT INTO account_access(user_id,seconds) VALUES('custom',7)")
            db.execute("INSERT INTO account_cooldowns VALUES('custom',4)")
            db.execute("INSERT INTO account_access(user_id,plan,starts,ends) VALUES('subscriber','Subscription',0,2000)")
        self.save(20,0)
        self.assertEqual(m.access_for('custom')['seconds'],7);self.assertEqual(m.access_for('custom')['cooldown'],4)
        with patch.object(m.time,'time',return_value=1000):
            self.assertTrue(m.access_for('subscriber')['subscribed']);self.assertTrue(m.access_for('admin')['unlimited'])
            unlimited=self.call('post','/api/run/start',headers=self.headers,json={});self.assertIsNone(unlimited.json['deadline'])

    def test_active_run_keeps_its_original_cooldown(self):
        self.save(20,6)
        guest=m.app.test_client()
        with patch.object(m.time,'time',return_value=1000):run=guest.post('/api/run/start',base_url=m.ORIGIN,headers={'Origin':m.ORIGIN},json={}).json
        self.save(8,1)
        with patch.object(m.time,'time',return_value=1005):
            finish=guest.post('/api/run/finish',base_url=m.ORIGIN,headers={'Origin':m.ORIGIN},json={'token':run['token']})
            self.assertEqual(finish.json['ready'],1011)
        with patch.object(m.time,'time',return_value=1012):
            next_run=guest.post('/api/run/start',base_url=m.ORIGIN,headers={'Origin':m.ORIGIN},json={}).json
            self.assertEqual(next_run['deadline'],1020);self.assertEqual(next_run['ready'],1021)

    def test_defaults_persist_when_initialization_runs_again_and_are_audited(self):
        self.save(9,0);m.init_access()
        with patch.object(m,'DEFAULT_RUN_SECONDS',999),patch.object(m,'DEFAULT_COOLDOWN_SECONDS',999):m.init_access()
        self.assertEqual(m.runtime_defaults()['seconds'],9);self.assertEqual(m.runtime_defaults()['cooldown'],0)
        with m.database() as db:row=db.execute("SELECT * FROM access_audit WHERE target='_platform_defaults'").fetchone()
        self.assertEqual(row['actor'],'admin');self.assertEqual(json.loads(row['after_json'])['seconds'],9)

if __name__=='__main__':unittest.main()
