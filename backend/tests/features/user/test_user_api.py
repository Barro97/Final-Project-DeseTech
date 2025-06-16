from fastapi.testclient import TestClient
from fastapi import status
import pytest

# Adjust import based on your project structure
from backend.features.user.schemas import UserCreate, UserUpdate, User as UserSchema

# Test data
@pytest.fixture
def new_user_payload() -> dict:
    return {
        "email": "testuser@example.com",
        "username": "testusername",
        "password": "StrongPass123!",
        "first_name": "Test",
        "last_name": "User",
        "gender": "other",
        "country": "Testland",
        "role_id": 1
    }

def test_create_user_success(client: TestClient, new_user_payload: dict):
    response = client.post("/users/", json=new_user_payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == new_user_payload["email"]
    assert data["username"] == new_user_payload["username"]
    assert "user_id" in data
    assert "password" not in data # Ensure password is not returned

def test_signup_success_with_auto_login(client: TestClient):
    """Test the new signup endpoint that auto-generates username and logs in the user"""
    signup_payload = {
        "email": "testuser@example.com",
        "password": "StrongPass123!",
        "first_name": "Test",
        "last_name": "User",
        "gender": "other",
        "country": "Testland"
    }
    
    response = client.post("/users/signup", json=signup_payload)
    assert response.status_code == status.HTTP_201_CREATED
    
    data = response.json()
    
    # Check that user data is included
    assert "user" in data
    user_data = data["user"]
    assert user_data["email"] == signup_payload["email"]
    assert user_data["first_name"] == signup_payload["first_name"]
    assert user_data["last_name"] == signup_payload["last_name"]
    assert "username" in user_data  # Should be auto-generated
    
    # Check that authentication token is included for immediate login
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
    assert "message" in data
    
    # Ensure password is not returned
    assert "password" not in user_data

def test_create_user_duplicate_email(client: TestClient, new_user_payload: dict):
    client.post("/users/", json=new_user_payload) # Create first user
    response = client.post("/users/", json=new_user_payload) # Attempt to create duplicate
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Email or username already registered" in response.json()["detail"]

def test_read_user_success(client: TestClient, new_user_payload: dict):
    create_response = client.post("/users/", json=new_user_payload)
    user_id = create_response.json()["user_id"]

    response = client.get(f"/users/{user_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["user_id"] == user_id
    assert data["email"] == new_user_payload["email"]

def test_read_user_not_found(client: TestClient):
    response = client.get("/users/99999") # Assuming 99999 is a non-existent ID
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "User not found" in response.json()["detail"]

def test_update_user_success(client: TestClient, new_user_payload: dict):
    create_response = client.post("/users/", json=new_user_payload)
    user_id = create_response.json()["user_id"]

    update_payload = {"first_name": "UpdatedTest", "country": "UpdatedLand"}
    response = client.put(f"/users/{user_id}", json=update_payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["first_name"] == "UpdatedTest"
    assert data["country"] == "UpdatedLand"
    assert data["email"] == new_user_payload["email"] # Ensure other fields are unchanged

def test_update_user_not_found(client: TestClient):
    update_payload = {"first_name": "UpdatedTest"}
    response = client.put("/users/99999", json=update_payload)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "User not found" in response.json()["detail"]

def test_delete_user_success(client: TestClient, new_user_payload: dict):
    create_response = client.post("/users/", json=new_user_payload)
    user_id = create_response.json()["user_id"]

    response = client.delete(f"/users/{user_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify user is actually deleted
    get_response = client.get(f"/users/{user_id}")
    assert get_response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_user_not_found(client: TestClient):
    response = client.delete("/users/99999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "User not found" in response.json()["detail"] 