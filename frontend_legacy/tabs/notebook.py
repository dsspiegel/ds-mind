import streamlit as st
import requests
import uuid
from config import BACKEND_URL
from components.code_cell import code_cell
from components.result_display import display_result

def execute_cell(idx, cell):
    with st.spinner(f"Running Cell {idx+1}..."):
        try:
            resp = requests.post(f"{BACKEND_URL}/execute/python", json={
                "session_id": st.session_state.session_id,
                "cell_id": cell['id'],
                "code": cell['code'],
                "cell_order": idx,
                "mind_id": st.session_state.mind_id
            })
            if resp.status_code == 200:
                cell['result'] = resp.json()
                return True
            else:
                st.error(f"Error: {resp.text}")
        except Exception as e:
            st.error(str(e))
    return False

def render():
    st.header('📓 "Colab"')
    
    if 'session_id' not in st.session_state:
        st.session_state.session_id = f"sess_{uuid.uuid4().hex[:8]}"

    # Initialize cells if not present
    if 'cells' not in st.session_state:
        st.session_state.cells = [{'id': str(uuid.uuid4()), 'code': '# Write Python code here\n', 'result': None}]

    # Toolbar
    col_a, col_b = st.columns([1, 4])
    with col_a:
        if st.button("+ Add Cell"):
            st.session_state.cells.append({'id': str(uuid.uuid4()), 'code': '', 'result': None})
    with col_b:
        st.caption("Shortcut: Press **Cmd+Enter** (Mac) or **Ctrl+Enter** (Win) to run and add new cell.")

    # Render cells
    # Use a copy of the list to allow modification during iteration if needed (appending)
    for idx, cell in enumerate(st.session_state.cells):
        with st.container():
            col1, col2 = st.columns([6, 1])
            should_run = False
            
            with col1:
                # Catch "Cmd-Enter" / Blur by checking for value change
                new_code = code_cell(cell['code'], key=f"cell_{cell['id']}")
                if new_code != cell['code']:
                    cell['code'] = new_code
                    should_run = True
            
            with col2:
                if st.button("▶", key=f"run_{cell['id']}"):
                    should_run = True
            
            if should_run:
                success = execute_cell(idx, cell)
                # If valid run and it's the last cell, add a new one (Shift-Enter behavior)
                if success and idx == len(st.session_state.cells) - 1:
                    st.session_state.cells.append({'id': str(uuid.uuid4()), 'code': '', 'result': None})
                    st.rerun()

            if cell['result']:
                display_result(cell['result'])
            st.divider()
