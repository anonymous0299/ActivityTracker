import requests

def test_login():
    url = "https://api.clockify.me/api/auth/token"
    url_v1 = "https://api.clockify.me/api/v1/auth/token"
    
    payload = {
        "email": "test@example.com",
        "password": "password"
    }
    
    print("Testing /api/auth/token...")
    try:
        r = requests.post(url, json=payload)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
