import streamlit as st
import pandas as pd

def display_result(result: dict):
    if not result: return
    
    st.caption(f"Output type: {result.get('output_type')}")
    
    if result.get('error'):
        st.error(result['error'])
    elif result.get('output_type') == 'dataframe':
        data = result.get('display_data', {})
        if data.get('html'):
            st.markdown(data['html'], unsafe_allow_html=True)
            st.caption(f"Shape: {data.get('shape')}")
    else:
        st.code(result.get('output'))

    if result.get('claim_generated'):
        c = result['claim_generated']
        st.info(f"💡 **Claim Generated:** {c.get('content')} (Confidence: {c.get('confidence')})")
