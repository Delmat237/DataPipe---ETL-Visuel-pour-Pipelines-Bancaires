from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import io
import csv
import json

from ..extensions import db
from ..models import Run, Pipeline
from ..utils import check_pipeline_access, paginate

results_bp = Blueprint('results', __name__)

EXPORTS_STORE = {}


def _get_run_data(run):
    results = run.node_results
    if not results:
        return []
    last_node = list(results.values())[-1] if results else {}
    return last_node.get('output_preview', [
        {'id': i + 1, 'montant': round(1000 + i * 157.3, 2), 'date': '2026-06-01'} for i in range(5)
    ])


@results_bp.route('/pipelines/<pipeline_id>/results', methods=['GET'])
@jwt_required()
def list_pipeline_results(pipeline_id):
    user_id = get_jwt_identity()
    pipeline, err = check_pipeline_access(pipeline_id, user_id)
    if err:
        return jsonify({'error': err}), 404 if 'not found' in err else 403

    runs = Run.query.filter_by(pipeline_id=pipeline_id, status='success').order_by(Run.started_at.desc()).limit(10).all()
    results = []
    for run in runs:
        results.append({
            'id': run.id,            # le front utilise `id` (= run_id) pour download/export
            'run_id': run.id,
            'pipeline_id': pipeline_id,
            'created_at': run.finished_at.isoformat() + 'Z' if run.finished_at else None,
            'rows_count': sum(v.get('rows_output', 0) for v in run.node_results.values()),
            'duration_ms': run.duration_ms,
        })
    return jsonify({'results': results})


@results_bp.route('/runs/<run_id>/results', methods=['GET'])
@jwt_required()
def get_run_results(run_id):
    run = Run.query.get(run_id)
    if not run:
        return jsonify({'error': 'Run not found'}), 404
    data = _get_run_data(run)
    return jsonify({
        'run_id': run_id,
        'pipeline_id': run.pipeline_id,
        'status': run.status,
        'rows': data,
        'rows_count': len(data),
        'node_summary': {nid: {'rows': v.get('rows_output', 0), 'duration_ms': v.get('duration_ms', 0)} for nid, v in run.node_results.items()},
    })


@results_bp.route('/results/<result_id>', methods=['GET'])
@jwt_required()
def get_result(result_id):
    run = Run.query.get(result_id)
    if not run or run.status != 'success':
        return jsonify({'error': 'Result not found'}), 404
    data = _get_run_data(run)
    return jsonify({'id': result_id, 'data': data, 'rows_count': len(data), 'pipeline_id': run.pipeline_id})


@results_bp.route('/results/<result_id>/download', methods=['GET'])
@jwt_required()
def download_result(result_id):
    run = Run.query.get(result_id)
    if not run:
        return jsonify({'error': 'Result not found'}), 404

    fmt = request.args.get('format', 'csv')
    data = _get_run_data(run)

    if fmt == 'json':
        output = io.BytesIO(json.dumps(data, ensure_ascii=False).encode())
        return send_file(output, mimetype='application/json', as_attachment=True, download_name=f'result_{result_id}.json')

    output = io.StringIO()
    if data:
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    csv_bytes = io.BytesIO(output.getvalue().encode())
    return send_file(csv_bytes, mimetype='text/csv', as_attachment=True, download_name=f'result_{result_id}.csv')


@results_bp.route('/results/<result_id>/export', methods=['POST'])
@jwt_required()
def export_result(result_id):
    run = Run.query.get(result_id)
    if not run:
        return jsonify({'error': 'Result not found'}), 404

    data = request.get_json() or {}
    export_id = f"exp_{result_id}"
    EXPORTS_STORE[export_id] = {
        'id': export_id,
        'result_id': result_id,
        'format': data.get('format', 'csv'),
        'status': 'completed',
        'created_at': datetime.utcnow().isoformat() + 'Z',
        'run_id': result_id,
    }
    return jsonify(EXPORTS_STORE[export_id]), 201


@results_bp.route('/exports', methods=['GET'])
@jwt_required()
def list_exports():
    return jsonify({'exports': list(EXPORTS_STORE.values())})


@results_bp.route('/exports/<export_id>', methods=['GET'])
@jwt_required()
def get_export(export_id):
    export = EXPORTS_STORE.get(export_id)
    if not export:
        return jsonify({'error': 'Export not found'}), 404
    return jsonify(export)


@results_bp.route('/exports/<export_id>', methods=['DELETE'])
@jwt_required()
def delete_export(export_id):
    if export_id not in EXPORTS_STORE:
        return jsonify({'error': 'Export not found'}), 404
    del EXPORTS_STORE[export_id]
    return jsonify({'message': 'Export deleted'})


@results_bp.route('/exports/<export_id>/retry', methods=['POST'])
@jwt_required()
def retry_export(export_id):
    export = EXPORTS_STORE.get(export_id)
    if not export:
        return jsonify({'error': 'Export not found'}), 404
    export['status'] = 'completed'
    return jsonify(export)


@results_bp.route('/exports/<export_id>/download', methods=['GET'])
@jwt_required()
def download_export(export_id):
    export = EXPORTS_STORE.get(export_id)
    if not export:
        return jsonify({'error': 'Export not found'}), 404

    run = Run.query.get(export.get('run_id'))
    data = _get_run_data(run) if run else []

    fmt = export.get('format', 'csv')
    if fmt == 'json':
        output = io.BytesIO(json.dumps(data, ensure_ascii=False).encode())
        return send_file(output, mimetype='application/json', as_attachment=True, download_name=f'export_{export_id}.json')

    output = io.StringIO()
    if data:
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    return send_file(io.BytesIO(output.getvalue().encode()), mimetype='text/csv', as_attachment=True, download_name=f'export_{export_id}.csv')
