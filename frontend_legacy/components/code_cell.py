import streamlit as st
from streamlit_ace import st_ace

def code_cell(code: str, key: str, language: str = "python", height: int = 150):
    return st_ace(
        value=code,
        language=language,
        theme="monokai",
        key=key,
        height=height,
        auto_update=False
    )
