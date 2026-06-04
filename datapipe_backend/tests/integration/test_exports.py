"""Tests d'intégration — Persistance des exports.

Prouve le correctif du bug remonté côté front : lorsqu'un nœud `file_export`
s'exécute, le backend DOIT créer un enregistrement d'export persisté (en base),
listable et téléchargeable via l'API /exports.
"""
import pytest
from tests.conftest import post_json

PBASE = '/api/v1/pipelines'
EBASE = '/api/v1/exports'


@pytest.fixture(scope='function')
def export_pipeline_id(client, auth_headers, workspace_id):
    """Pipeline contenant un nœud file_export."""
    pip = post_json(client, '/api/v1/pipelines', {
        'name': 'Pipeline Export',
        'workspace_id': workspace_id,
    }, headers=auth_headers).get_json()
    pipeline_id = pip['id']
    node = post_json(client, f'{PBASE}/{pipeline_id}/nodes', {
        'type': 'file_export',
        'label': 'Exporter CSV',
        'position': {'x': 100, 'y': 100},
        'config': {'format': 'csv', 'filename': 'resultat_test.csv'},
    }, headers=auth_headers)
    assert node.status_code == 201, node.get_data(as_text=True)
    return pipeline_id


class TestFileExportPersistence:
    def test_run_creates_persisted_export(self, client, auth_headers, export_pipeline_id):
        run = post_json(client, f'{PBASE}/{export_pipeline_id}/run', {}, headers=auth_headers)
        assert run.status_code == 201, run.get_data(as_text=True)
        run_id = run.get_json()['id']

        # L'export doit exister en base et être rattaché au run.
        resp = client.get(f'{EBASE}?run_id={run_id}', headers=auth_headers)
        assert resp.status_code == 200
        exports = resp.get_json()['exports']
        assert len(exports) >= 1, "Aucun export persisté pour un nœud file_export"

        exp = exports[0]
        assert exp['run_id'] == run_id
        assert exp['pipeline_id'] == export_pipeline_id
        assert exp['node_id'] is not None
        assert exp['format'] == 'csv'
        assert exp['status'] == 'completed'
        assert exp['filename']
        assert 'download_url' in exp

    def test_get_and_download_export(self, client, auth_headers, export_pipeline_id):
        run = post_json(client, f'{PBASE}/{export_pipeline_id}/run', {}, headers=auth_headers)
        run_id = run.get_json()['id']
        export_id = client.get(f'{EBASE}?run_id={run_id}', headers=auth_headers) \
            .get_json()['exports'][0]['id']

        detail = client.get(f'{EBASE}/{export_id}', headers=auth_headers)
        assert detail.status_code == 200
        assert detail.get_json()['id'] == export_id

        dl = client.get(f'{EBASE}/{export_id}/download', headers=auth_headers)
        assert dl.status_code == 200
        assert 'text/csv' in dl.content_type

    def test_delete_export(self, client, auth_headers, export_pipeline_id):
        run = post_json(client, f'{PBASE}/{export_pipeline_id}/run', {}, headers=auth_headers)
        run_id = run.get_json()['id']
        export_id = client.get(f'{EBASE}?run_id={run_id}', headers=auth_headers) \
            .get_json()['exports'][0]['id']

        deleted = client.delete(f'{EBASE}/{export_id}', headers=auth_headers)
        assert deleted.status_code == 200
        assert client.get(f'{EBASE}/{export_id}', headers=auth_headers).status_code == 404

    def test_export_not_found(self, client, auth_headers):
        assert client.get(f'{EBASE}/exp_inexistant', headers=auth_headers).status_code == 404
