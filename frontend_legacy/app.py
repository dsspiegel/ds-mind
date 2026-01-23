import streamlit as st
import requests
from config import BACKEND_URL
from tabs import notebook, plx, chat, about

st.set_page_config(page_title="your-ds-agent", page_icon="🤖", layout="wide")

# Sidebar / Header
with st.sidebar:
    st.title("🤖 your-ds-agent")
    
    # Check backend health
    try:
        requests.get(f"{BACKEND_URL}/", timeout=1)
        st.success("Backend Connected")
    except:
        st.error("Backend Disconnected")

    st.divider()
    
    # Mind Selection
    try:
        minds_resp = requests.get(f"{BACKEND_URL}/mind/")
        if minds_resp.status_code == 200:
            minds = minds_resp.json()
            mind_options = {m['name']: m['id'] for m in minds}
            mind_keys = list(mind_options.keys())
            
            selected_mind = st.selectbox(
                "🧠 Select Mind", 
                ["Create New..."] + mind_keys,
                index=1 if mind_keys else 0
            )
            
            if selected_mind == "Create New...":
                name = st.text_input("New Mind Name")
                if st.button("Create"):
                    r = requests.post(f"{BACKEND_URL}/mind/", params={"name": name})
                    if r.status_code == 200:
                        st.success("Created!")
                        st.rerun()
            elif selected_mind:
                st.session_state.mind_id = mind_options[selected_mind]
        else:
            st.error("Failed to load minds")
    except Exception as e:
        st.error(f"Error loading minds: {e}")

    # Model Selection
    st.session_state.model = st.selectbox(
        "✨ Model", 
        ["gemini-3-flash-preview", "gemini-3-pro-preview"]
    )

if not st.session_state.get('mind_id'):
    st.info("Please create or select a Mind from the sidebar to begin.")
    st.stop()

# Main Navigation
# Handle URL routing
query_params = st.query_params
default_tab = query_params.get("tab", "colab")

TABS = {
    "colab": '"Colab"',
    "plx": '"Plx"',
    "chat": "Chat",
    "about": "About"
}

# Ensure valid default
if default_tab not in TABS:
    default_tab = "colab"

# Custom CSS to make radio buttons look like tabs
st.markdown("""
<style>
    div[data-testid="stRadio"] > div {
        gap: 0px;
    }
    div[data-testid="stRadio"] label > div:first-child {
        display: none;
    }
    div[data-testid="stRadio"] label {
        padding: 10px 20px;
        border-radius: 5px 5px 0 0;
        border: 1px solid #ddd;
        border-bottom: none;
        margin-right: 5px;
        transition: background-color 0.3s;
    }
    div[data-testid="stRadio"] label:hover {
        background-color: #f0f2f6;
    }
    div[aria-checked="true"] {
        background-color: #262730 !important;
        color: white !important;
        border-bottom: 2px solid #ff4b4b !important;
    }
</style>
""", unsafe_allow_html=True)

# Render navigation (simulating tabs with radio for state control)
selected_tab_label = st.radio(
    "Navigation",
    options=list(TABS.values()),
    index=list(TABS.keys()).index(default_tab),
    horizontal=True,
    label_visibility="collapsed"
)

# Reverse lookup to get key and update URL
selected_key = next(k for k, v in TABS.items() if v == selected_tab_label)
if selected_key != default_tab:
    st.query_params["tab"] = selected_key
    # Rerun to clean up URL state if needed, though strictly query_params assignment might be enough
    # st.rerun() 

st.divider()

if selected_key == "colab":
    notebook.render()
elif selected_key == "plx":
    plx.render()
elif selected_key == "chat":
    chat.render()
elif selected_key == "about":
    about.render()
