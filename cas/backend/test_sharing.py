import copy
import json
import unittest
import zipfile
from pathlib import Path
from test_app import Tests, m


def example():
    with zipfile.ZipFile(Path(__file__).resolve().parents[2] / 'blocks/examples/sim-dashboard.codynick') as archive:
        read = lambda name: json.loads(archive.read(name))
        return dict(format='codynick-webserial', version=3, projectSchema='codynick-project/1', applicationVersion='3.20.4',
                    workspace=read('programs/blocks.json'), python=archive.read('programs/main.py').decode(),
                    editor=read('state/editor.json'), state=dict(live=read('state/live.json'), sprite=read('state/sprite.json'),
                    layout=read('state/dashboard-layout.json'), simulatorView=read('state/simulator-view.json')))


class SharingTests(unittest.TestCase):
    def setUp(self):
        with m.database() as db:
            for table in ('published_shares', 'share_reports', 'sessions', 'users', 'projects', 'account_access'):
                db.execute('DELETE FROM '+table)
        self.client=m.app.test_client()
        self.headers=Tests.user(self, self.client, 'student')
        self.data=dict(title='My shared project', description='A simulation', display_name='Sky', selection='both', reviewed=True, project=example())

    def call(self, method, path, **kw):
        return getattr(self.client, method)(path, base_url=m.ORIGIN, **kw)

    def publish(self):
        response=self.call('post','/api/shares',json=self.data,headers=self.headers)
        self.assertEqual(response.status_code,201,response.json)
        return response.json

    def test_guest_csrf_and_owner_isolation(self):
        guest=m.app.test_client()
        self.assertEqual(guest.post('/api/shares',base_url=m.ORIGIN,json=self.data).status_code,401)
        self.assertEqual(self.call('post','/api/shares',json=self.data).status_code,403)
        share=self.publish();other=m.app.test_client();headers=Tests.user(self,other,'other')
        self.assertEqual(other.get('/api/shares',base_url=m.ORIGIN).json['shares'],[])
        self.assertEqual(other.delete('/api/shares/'+share['id'],base_url=m.ORIGIN,headers=headers).status_code,404)
        self.assertEqual(other.put('/api/shares/'+share['id'],base_url=m.ORIGIN,json=dict(self.data,revision=1),headers=headers).status_code,404)

    def test_public_snapshot_excludes_identity_and_hidden_state(self):
        p=self.data['project'];p['email']='private@example.test';p['editor']['console']='private console';p['state']['live']['wifi']={'ssid':'private','password':'secret'}
        p['state']['live']['scene']['credentials']={'password':'secret'}
        p['editor']['publication']={'id':'private-publication-id'}
        sample=copy.deepcopy(next(iter(p['state']['live']['widgets'].values())))
        sample['id']='secret';p['state']['live']['widgets']['secret']=sample
        share=self.publish();response=self.call('get','/api/shared/'+share['token']);data=response.json
        self.assertEqual(response.status_code,200);self.assertNotIn('owner',data);self.assertNotIn('id',data)
        self.assertEqual(data['project']['editor']['console'],'');self.assertNotIn('wifi',data['project']['state']['live'])
        self.assertNotIn('credentials',data['project']['state']['live']['scene'])
        self.assertNotIn('publication',data['project']['editor'])
        self.assertIn('secret',data['project']['state']['live']['widgets'])
        self.assertNotIn('private@example.test',response.get_data(as_text=True));self.assertIn('noindex',response.headers['X-Robots-Tag'])
        self.assertNotIn('Access-Control-Allow-Origin',response.headers)
        self.assertEqual(data['project']['editor']['names']['python'],self.data['title'])

    def test_selection_snapshot_update_conflict_and_revoke(self):
        for selection in ('blocks','python'):
            self.data['selection']=selection;share=self.publish();url='/api/shared/'+share['token'];project=self.call('get',url).json['project']
            if selection=='blocks': self.assertEqual(project['python'],'')
            else: self.assertEqual(project['workspace']['blocks']['blocks'],[])
            self.data['project']['python']='print("changed privately")'
            self.assertEqual(self.call('get',url).json['project'],project)
            updated=self.call('put','/api/shares/'+share['id'],json=dict(self.data,revision=1),headers=self.headers)
            self.assertEqual(updated.status_code,200);self.assertEqual(updated.json['revision'],2)
            self.assertEqual(updated.json['token'],share['token'])
            self.assertEqual(self.call('put','/api/shares/'+share['id'],json=dict(self.data,revision=1),headers=self.headers).status_code,409)
            self.assertEqual(self.call('delete','/api/shares/'+share['id'],headers=self.headers).status_code,200)
            self.assertEqual(self.call('get',url).status_code,404)

    def test_review_validation_limits_and_prototype_rejection(self):
        self.data['reviewed']=False;self.assertEqual(self.call('post','/api/shares',json=self.data,headers=self.headers).status_code,400)
        self.data['reviewed']=True
        for key,value in [('selection','invalid'),('title','')]:
            data=dict(self.data);data[key]=value
            self.assertEqual(self.call('post','/api/shares',json=data,headers=self.headers).status_code,400)
        self.data['project']['state']['live']['scene']['__proto__']={}
        self.assertEqual(self.call('post','/api/shares',json=self.data,headers=self.headers).status_code,400)
        del self.data['project']['state']['live']['scene']['__proto__']
        preview=self.call('post','/api/shares/preview',json=self.data,headers=self.headers)
        self.assertEqual(preview.status_code,200);self.assertEqual(self.call('get','/api/shares').json['shares'],[])
        self.data['project']['python']='x'*100001
        self.assertEqual(self.call('post','/api/shares',json=self.data,headers=self.headers).status_code,400)

    def test_reports_and_admin_removal(self):
        self.data.update(visibility='public',public_confirmed=True)
        share=self.publish();url='/api/shared/'+share['token']+'/report'
        self.assertEqual(self.call('post',url,json={'reason':'Concern'}).status_code,403)
        self.assertEqual(self.call('post',url,json={'reason':'Concern'},headers={'Origin':m.ORIGIN}).status_code,200)
        self.assertEqual(self.call('get','/api/admin/shares').status_code,403)
        with m.database() as db:db.execute("INSERT INTO account_access(user_id,role) VALUES('student','admin')")
        reports=self.call('get','/api/admin/shares').json['shares'];self.assertEqual(reports[0]['reports'],1)
        self.assertEqual(self.call('delete','/api/admin/shares/'+share['id'],headers=self.headers).status_code,200)
        self.assertEqual(self.call('get','/api/shared/'+share['token']).status_code,404)
        self.assertEqual(self.call('get','/api/gallery').json['total'],0)

    def test_gallery_requires_public_opt_in_and_visibility_changes_are_owned(self):
        unlisted=self.publish()
        self.assertEqual(unlisted['visibility'],'unlisted')
        self.assertEqual(self.call('get','/api/gallery').json['total'],0)
        self.data['visibility']='public'
        self.assertEqual(self.call('post','/api/shares',json=self.data,headers=self.headers).status_code,400)
        self.assertEqual(self.call('post','/api/shares/preview',json=self.data,headers=self.headers).status_code,200)
        self.data['public_confirmed']=True;share=self.publish()
        self.assertEqual(self.call('get','/api/gallery').json['total'],1)
        url='/api/shares/'+share['id']+'/visibility'
        change=dict(visibility='unlisted',revision=1)
        self.assertEqual(self.call('patch',url,json=change).status_code,403)
        other=m.app.test_client();headers=Tests.user(self,other,'outsider')
        self.assertEqual(other.patch(url,base_url=m.ORIGIN,json=change,headers=headers).status_code,404)
        self.assertEqual(self.call('patch',url,json=dict(change,revision=0),headers=self.headers).status_code,409)
        result=self.call('patch',url,json=change,headers=self.headers)
        self.assertEqual(result.status_code,200);self.assertEqual(result.json['revision'],2)
        self.assertEqual(result.json['token'],share['token']);self.assertEqual(self.call('get','/api/gallery').json['total'],0)
        self.assertEqual(self.call('get','/api/shared/'+share['token']).status_code,200)
        relist=dict(visibility='public',revision=2)
        self.assertEqual(self.call('patch',url,json=relist,headers=self.headers).status_code,400)
        self.assertEqual(self.call('patch',url,json=dict(relist,public_confirmed=True),headers=self.headers).status_code,200)
        self.assertEqual(self.call('get','/api/gallery').json['total'],1)
        self.assertEqual(self.call('delete','/api/shares/'+share['id'],headers=self.headers).status_code,200)
        self.assertEqual(self.call('get','/api/gallery').json['total'],0)

    def test_gallery_search_filters_pagination_and_metadata_privacy(self):
        self.data.update(visibility='public',public_confirmed=True,title='Straße weather 100% _sky_',description='A sensor garden',display_name='River')
        with m.database() as db:db.execute("UPDATE users SET name='River' WHERE id='student'")
        target=self.publish()
        self.data.update(title='Other project',description='Different topic',display_name='Sky',selection='python')
        with m.database() as db:db.execute("UPDATE users SET name='Sky' WHERE id='student'")
        for _ in range(21):self.publish()
        self.data.update(visibility='unlisted',title='Hidden River garden');self.publish()
        gallery=self.call('get','/api/gallery').json
        self.assertEqual(gallery['total'],22);self.assertEqual(len(gallery['projects']),20);self.assertEqual(gallery['pages'],2)
        second=self.call('get','/api/gallery?page=2').json
        self.assertEqual(len(second['projects']),2)
        self.assertEqual(self.call('get','/api/gallery?page=100000').json['page'],2)
        self.assertFalse(set(row['token'] for row in gallery['projects'])&set(row['token'] for row in second['projects']))
        for query in ('STRASSE','River garden','100%','_sky_'):
            data=self.call('get','/api/gallery',query_string={'q':query}).json
            self.assertEqual(data['total'],1,query);self.assertEqual(data['projects'][0]['token'],target['token'])
            for hidden in ('owner','id','body','project','email','search_text'):
                self.assertNotIn(hidden,data['projects'][0])
        self.assertEqual(self.call('get','/api/gallery?language=blocks').json['total'],1)
        self.assertEqual(self.call('get','/api/gallery?language=python').json['total'],22)
        for query in ("' OR 1=1 --",'Hidden','private@example.test'):
            self.assertEqual(self.call('get','/api/gallery',query_string={'q':query}).json['total'],0)
        for args in ({'q':'x'*121},{'page':'0'},{'page':'bad'},{'sort':'owner'},{'language':'private'},{'q':' '.join(['a']*13)}):
            self.assertEqual(self.call('get','/api/gallery',query_string=args).status_code,400)

    def test_gallery_update_changes_search_without_exposing_private_edits(self):
        self.data.update(visibility='public',public_confirmed=True,title='Original public title')
        share=self.publish()
        self.data['title']='Changed public title'
        self.assertEqual(self.call('get','/api/gallery?q=Changed').json['total'],0)
        self.assertEqual(self.call('put','/api/shares/'+share['id'],json=dict(self.data,revision=1),headers=self.headers).status_code,200)
        self.assertEqual(self.call('get','/api/gallery?q=Original').json['total'],0)
        self.assertEqual(self.call('get','/api/gallery?q=Changed').json['total'],1)

    def test_gallery_migration_keeps_older_shares_unlisted(self):
        import sqlite3,tempfile
        from contextlib import contextmanager,closing
        from flask import Flask
        from sharing import register_sharing
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'old.sqlite3'
            @contextmanager
            def database():
                with closing(sqlite3.connect(path)) as db:
                    db.row_factory=sqlite3.Row
                    yield db
                    db.commit()
            with database() as db:
                db.execute('CREATE TABLE published_shares(id TEXT PRIMARY KEY,token TEXT UNIQUE NOT NULL,owner TEXT NOT NULL,title TEXT NOT NULL,description TEXT NOT NULL,display_name TEXT NOT NULL,selection TEXT NOT NULL,body TEXT NOT NULL,revision INTEGER NOT NULL,created INTEGER NOT NULL,updated INTEGER NOT NULL)')
                db.execute('INSERT INTO published_shares VALUES(?,?,?,?,?,?,?,?,?,?,?)',('old','x'*43,'owner','Old snapshot','Description','Sky','both',json.dumps(self.data['project']),1,1,1))
            app=Flask('migration')
            register_sharing(app,database,lambda *args:None,lambda *args:None,m.ORIGIN)
            with database() as db:
                row=db.execute('SELECT * FROM published_shares').fetchone()
                self.assertEqual(row['visibility'],'unlisted');self.assertEqual(row['title'],'Old snapshot')
            self.assertEqual(app.test_client().get('/api/gallery').json['total'],0)

    def test_storage_quota(self):
        for _ in range(50):self.publish()
        self.assertEqual(self.call('post','/api/shares',json=self.data,headers=self.headers).status_code,409)

    def test_designer_credit_comes_from_sso_not_client_input(self):
        with m.database() as db:db.execute("UPDATE users SET name='Verified Designer' WHERE id='student'")
        self.data.update(display_name='Spoofed name',visibility='public',public_confirmed=True)
        share=self.publish();self.assertEqual(share['display_name'],'Verified Designer')
        self.assertEqual(self.call('get','/api/gallery?q=Verified').json['total'],1)
        self.assertEqual(self.call('get','/api/gallery?q=Spoofed').json['total'],0)


if __name__=='__main__':unittest.main()
