from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import io
import os
import csv
import json

from ..extensions import db
from ..models import Run, Pipeline, Export
from ..utils import check_pipeline_access, paginate

results_bp = Blueprint('results', __name__)


def _write_export_file(rows, fmt, export_id):
    """Materialize result rows to disk and return (filename, path, size)."""
    out_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'exports')
    os.makedirs(out_dir, exist_ok=True)
    ext = 'json' if fmt == 'json' else 'csv'
    filename = f"export_{export_id}.{ext}"
    path = os.path.join(out_dir, filename)
    if fmt == 'json':
        with open(path, 'w', encoding='utf-8') as fh:
            json.dump(rows, fh, ensure_ascii=False, indent=2)
    else:
        with open(path, 'w', encoding='utf-8', newline='') as fh:
            if rows:
                writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
                writer.writeheader()
                writer.writerows(rows)
    size = os.path.getsize(path) if os.path.exists(path) else 0
    return filename, path, size


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
    fmt = data.get('format', 'csv')
    rows = _get_run_data(run)

    export = Export(
        run_id=run.id,
        pipeline_id=run.pipeline_id,
        format=fmt,
        rows=len(rows),
        status='completed',
    )
    db.session.add(export)
    db.session.flush()  # populate export.id before writing the file

    filename, path, size = _write_export_file(rows, fmt, export.id)
    export.filename = filename
    export.path = path
    export.size = size
    db.session.commit()

    return jsonify(export.to_dict()), 201


@results_bp.route('/exports', methods=['GET'])
@jwt_required()
def list_exports():
    q = Export.query
    if request.args.get('run_id'):
        q = q.filter_by(run_id=request.args.get('run_id'))
    if request.args.get('pipeline_id'):
        q = q.filter_by(pipeline_id=request.args.get('pipeline_id'))
    exports = q.order_by(Export.created_at.desc()).all()
    return jsonify({'exports': [e.to_dict() for e in exports]})


@results_bp.route('/exports/<export_id>', methods=['GET'])
@jwt_required()
def get_export(export_id):
    export = Export.query.get(export_id)
    if not export:
        return jsonify({'error': 'Export not found'}), 404
    return jsonify(export.to_dict())


@results_bp.route('/exports/<export_id>', methods=['DELETE'])
@jwt_required()
def delete_export(export_id):
    export = Export.query.get(export_id)
    if not export:
        return jsonify({'error': 'Export not found'}), 404
    if export.path and os.path.exists(export.path):
        try:
            os.remove(export.path)
        except OSError:
            pass
    db.session.delete(export)
    db.session.commit()
    return jsonify({'message': 'Export deleted'})


@results_bp.route('/exports/<export_id>/retry', methods=['POST'])
@jwt_required()
def retry_export(export_id):
    export = Export.query.get(export_id)
    if not export:
        return jsonify({'error': 'Export not found'}), 404

    # Regenerate the file from the run's result data if it's missing on disk.
    if not (export.path and os.path.exists(export.path)):
        run = Run.query.get(export.run_id)
        rows = _get_run_data(run) if run else []
        filename, path, size = _write_export_file(rows, export.format or 'csv', export.id)
        export.filename = filename
        export.path = path
        export.size = size
        export.rows = len(rows)
    export.status = 'completed'
    db.session.commit()
    return jsonify(export.to_dict())


@results_bp.route('/exports/<export_id>/download', methods=['GET'])
@jwt_required()
def download_export(export_id):
    export = Export.query.get(export_id)
    if not export:
        return jsonify({'error': 'Export not found'}), 404

    fmt = export.format or 'csv'

    # Prefer the file actually persisted on disk by the engine / export request.
    if export.path and os.path.exists(export.path):
        mimetype = 'application/json' if fmt == 'json' else 'text/csv'
        return send_file(export.path, mimetype=mimetype, as_attachment=True,
                         download_name=export.filename or f'export_{export_id}.{fmt}')

    # Fallback: regenerate from the run's result data.
    run = Run.query.get(export.run_id)
    data = _get_run_data(run) if run else []
    if fmt == 'json':
        output = io.BytesIO(json.dumps(data, ensure_ascii=False).encode())
        return send_file(output, mimetype='application/json', as_attachment=True, download_name=f'export_{export_id}.json')

    output = io.StringIO()
    if data:
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    return send_file(io.BytesIO(output.getvalue().encode()), mimetype='text/csv', as_attachment=True, download_name=f'export_{export_id}.csv')
