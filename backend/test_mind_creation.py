
import requests
import json

API_URL = "http://127.0.0.1:8000"

def test_create_mind_with_claims_no_id():
    print("Testing creation with claims missing IDs...")
    claims = [
        {"content": "Test claim 1", "type": "observation", "source": "test", "confidence": 1.0}
    ]
    
    try:
        res = requests.post(
            f"{API_URL}/mind/",
            data={
                "name": "Test Mind No ID",
                "claims_json": json.dumps(claims)
            }
        )
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Request failed: {e}")

def test_create_mind_with_claims_with_id():
    print("\nTesting creation with claims HAVING IDs...")
    claims = [
        {"id": "claim-123", "content": "Test claim 2", "type": "observation", "source": "test", "confidence": 1.0}
    ]
    
    try:
        res = requests.post(
            f"{API_URL}/mind/",
            data={
                "name": "Test Mind With ID",
                "claims_json": json.dumps(claims)
            }
        )
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_create_mind_with_claims_no_id()
    test_create_mind_with_claims_with_id()
