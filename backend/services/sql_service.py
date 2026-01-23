from google.cloud import bigquery, firestore
from google import genai
from config import GOOGLE_API_KEY
from models import Claim

bq_client = bigquery.Client()
db = firestore.Client()

DEMO_SCHEMA = """
Tables in demo_gemini dataset:
1. daily_metrics: date, device_type, cohort, active_users, churned_users, churn_rate
2. intent_performance: date, device_type, intent_category, intent_count, success_rate, avg_latency_ms
"""

def execute_sql(sql: str) -> dict:
    try:
        job = bq_client.query(sql)
        rows = list(job.result())
        # Check if empty
        if not rows:
             return {'success': True, 'row_count': 0, 'columns': [], 'sample_rows': []}

        columns = [f.name for f in job.result().schema]
        sample = [{c: (v.isoformat() if hasattr(v, 'isoformat') else v) 
                   for c, v in zip(columns, row)} for row in rows[:100]]
        return {'success': True, 'row_count': len(rows), 'columns': columns, 'sample_rows': sample}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def generate_summary(sql: str, result: dict) -> str:
    if not result.get('success'): return f"Query failed: {result.get('error')}"
    
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
        prompt = f"Summarize this SQL result in one sentence:\nSQL: {sql[:300]}\nRows: {result['row_count']}\nSample: {result['sample_rows'][:3]}"
        response = client.models.generate_content(
            model='gemini-3-flash-preview',
            contents=prompt
        )
        return response.text.strip()
    except:
        return f"Query returned {result.get('row_count', 0)} rows with columns: {', '.join(result.get('columns', [])[:5])}"

def execute_and_observe(session_id: str, mind_id: str, sql: str, auto_learn: bool = True):
    result = execute_sql(sql)
    summary = generate_summary(sql, result)
    
    if result.get('success'):
        claim = Claim(
            content=summary,
            type="observation",
            confidence=0.9,
            source=f"plx_query",
            metadata={'sql': sql[:500], 'row_count': result['row_count']}
        )
        if auto_learn:
            db.collection('minds').document(mind_id).set({
                'claims': firestore.ArrayUnion([claim.dict()])
            }, merge=True)
            result['claim_generated'] = claim
        else:
             # Ephemeral
             # Backend returns it as claim_generated, frontend context adds to pending
             result['claim_generated'] = claim
    
    return result

def generate_sql_from_text(question: str, mind_id: str) -> str:
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
        prompt = f"Generate BigQuery SQL for: {question}\n\nSchema:\n{DEMO_SCHEMA}\n\nReturn ONLY SQL, no explanation."
        response = client.models.generate_content(
            model='gemini-3-flash-preview',
            contents=prompt
        )
        sql = response.text.strip()
        if '```' in sql:
            import re
            match = re.search(r'```(?:sql)?\n?(.*?)\n?```', sql, re.DOTALL)
            if match:
                sql = match.group(1)
        return sql
    except:
        return "SELECT * FROM demo_gemini.daily_metrics LIMIT 10;"
