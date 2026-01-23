import streamlit as st
import requests
from config import BACKEND_URL

def render():
    st.header("💬 Chat with Mind")
    
    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = []

    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if "claims" in message and message["claims"]:
                with st.expander("📚 Sources & Claims Used"):
                    for c in message["claims"]:
                        st.markdown(f"- **{c.get('confidence', 0)}**: {c.get('content')} _(Source: {c.get('source')})_")

    # Chat input
    if prompt := st.chat_input("Ask a question about your data..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                try:
                    resp = requests.post(f"{BACKEND_URL}/mind/chat", json={
                        "mind_id": st.session_state.mind_id,
                        "question": prompt,
                        "model": st.session_state.get('model', 'gemini-3-flash-preview')
                    })
                    
                    if resp.status_code == 200:
                        data = resp.json()
                        answer = data['answer']
                        claims = data['claims_used']
                        
                        st.markdown(answer)
                        if claims:
                            with st.expander("📚 Sources & Claims Used"):
                                for c in claims:
                                    st.markdown(f"- **{c.get('confidence', 0)}**: {c.get('content')} _(Source: {c.get('source')})_")
                        
                        st.session_state.messages.append({
                            "role": "assistant", 
                            "content": answer,
                            "claims": claims
                        })
                        
                        if data.get('handoff'):
                            handoff = data['handoff']
                            if handoff['type'] == 'sql':
                                st.info(f"Generated SQL: `{handoff['sql']}`")
                                # Optional: Add button to copy to PLX
                    else:
                        st.error(f"Error: {resp.text}")
                except Exception as e:
                    st.error(str(e))
