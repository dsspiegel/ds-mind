import streamlit as st
import requests
import uuid
from config import BACKEND_URL
from components.code_cell import code_cell

def render():
    st.header('📊 "Plx" - SQL Workbench')
    
    if 'plx_session_id' not in st.session_state:
        st.session_state.plx_session_id = f"plx_{uuid.uuid4().hex[:8]}"
        
    st.markdown("Query `demo_gemini` dataset using BigQuery SQL.")
    
    query = code_cell(
        st.session_state.get('last_query', "SELECT * FROM demo_gemini.daily_metrics LIMIT 5;"), 
        key="sql_editor", 
        language="sql", 
        height=200
    )
    st.session_state.last_query = query
    
    if st.button("Run Query 🚀"):
        with st.spinner("Executing BigQuery..."):
            try:
                resp = requests.post(f"{BACKEND_URL}/plx/query", json={
                    "session_id": st.session_state.plx_session_id,
                    "mind_id": st.session_state.mind_id,
                    "sql": query
                })
                
                if resp.status_code == 200:
                    result = resp.json()
                    st.session_state.plx_result = result
                else:
                    st.error(f"Backend Error: {resp.text}")
            except Exception as e:
                st.error(f"Request Error: {e}")

    if 'plx_result' in st.session_state:
        res = st.session_state.plx_result
        if res.get('success'):
            st.success(f"Query returned {res['row_count']} rows")
            st.dataframe(res['sample_rows'])
            
            if res.get('claim_generated'):
                c = res['claim_generated']
                st.info(f"💡 **Claim Generated:** {c.get('content')}")
        else:
            st.error(f"Query Failed: {res.get('error')}")
