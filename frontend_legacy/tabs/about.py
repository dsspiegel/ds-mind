import streamlit as st

def render():
    st.markdown("""
    ## your-ds-agent: Expert Knowledge Persistence System
    
    **Problem**: Acquired knowledge evaporates when sessions end.
    
    **Solution**: A "Mind" layer that persists derived knowledge (Claims) from your work.
    
    ### Architecture
    - **"Colab"**: Extracts claims from Python analysis
    - **"Plx"**: Extracts claims from SQL results
    - **Firestore**: Stores the "Mind" (knowledge graph)
    - **Gemini**: Answers questions using the persistent Mind
    """)
    
    st.graphviz_chart("""
    digraph G {
        rankdir=TB;
        
        subgraph cluster_execution {
            label = "Execution Layer";
            color=blue;
            node [style=filled, fillcolor=white];
            Notebook [label="\\"Colab\\" (Python)"];
            PLX [label="\\"Plx\\" (SQL)"];
            Execute [shape=rect];
            Extract [label="Extract Claim"];
            
            Notebook -> Execute;
            PLX -> Execute;
            Execute -> Extract;
        }

        subgraph cluster_storage {
            label = "Persistence";
            color=red;
            node [style=filled, fillcolor="#ffe0e0"];
            Firestore [label="Mind (Firestore)\nClaims & Metadata"];
            
            Extract -> Firestore;
        }

        subgraph cluster_retrieval {
            label = "Intelligence";
            color=green;
            node [style=filled, fillcolor="#e0ffe0"];
            Chat [label="Chat Q&A"];
            Retrieve [label="Retrieve Claims"];
            GenAI [label="Gemini (Answer)"];
            
            Chat -> Retrieve;
            Retrieve -> Firestore [dir=both, style=dashed];
            Retrieve -> GenAI;
            GenAI -> Chat;
        }
    }
    """)
