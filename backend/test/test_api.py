import os
import sys
from pathlib import Path


# Dodajemy folder backend do ścieżki importów Pythona.
BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# Testy używają oddzielnej, lokalnej bazy SQLite.
TEST_DATABASE_PATH = Path(__file__).parent / "test_vetcare.db"

os.environ["DATABASE_URL"] = (
    f"sqlite:///{TEST_DATABASE_PATH.as_posix()}"
)


from fastapi.testclient import TestClient

from database import Base, engine
from main import app


client = TestClient(app)


def setup_module():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def teardown_module():
    Base.metadata.drop_all(bind=engine)
    engine.dispose()

    if TEST_DATABASE_PATH.exists():
        TEST_DATABASE_PATH.unlink()


def register_user(
    email: str = "testy@vetcare.pl",
    password: str = "test123",
):
    return client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
        },
    )


def login_user(
    email: str = "testy@vetcare.pl",
    password: str = "test123",
):
    return client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )


def authorization_headers(token: str):
    return {
        "Authorization": f"Bearer {token}",
    }


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200


def test_register_user():
    response = register_user()

    assert response.status_code in (200, 201)

    data = response.json()

    assert data["email"] == "testy@vetcare.pl"
    assert "password" not in data
    assert "hashed_password" not in data


def test_duplicate_registration_is_rejected():
    response = register_user()

    assert response.status_code in (400, 409)


def test_login_user():
    response = login_user()

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"].lower() == "bearer"


def test_access_without_token_is_rejected():
    response = client.get("/users/me")

    assert response.status_code in (401, 403)


def test_get_current_user():
    login_response = login_user()
    token = login_response.json()["access_token"]

    response = client.get(
        "/users/me",
        headers=authorization_headers(token),
    )

    assert response.status_code == 200
    assert response.json()["email"] == "testy@vetcare.pl"


def test_pet_crud():
    login_response = login_user()
    token = login_response.json()["access_token"]
    headers = authorization_headers(token)

    create_response = client.post(
        "/pets",
        headers=headers,
        json={
            "name": "Luna",
            "species": "Kot",
            "breed": "Europejski",
            "birth_date": "2022-05-15",
        },
    )

    assert create_response.status_code in (200, 201)

    created_pet = create_response.json()
    pet_id = created_pet["id"]

    assert created_pet["name"] == "Luna"
    assert created_pet["species"] == "Kot"

    list_response = client.get(
        "/pets",
        headers=headers,
    )

    assert list_response.status_code == 200

    assert any(
        pet["id"] == pet_id
        for pet in list_response.json()
    )

    single_response = client.get(
        f"/pets/{pet_id}",
        headers=headers,
    )

    assert single_response.status_code == 200
    assert single_response.json()["name"] == "Luna"

    update_response = client.put(
        f"/pets/{pet_id}",
        headers=headers,
        json={
            "name": "Luna",
            "species": "Kot",
            "breed": "Kot europejski krótkowłosy",
            "birth_date": "2022-05-15",
        },
    )

    assert update_response.status_code == 200

    assert (
        update_response.json()["breed"]
        == "Kot europejski krótkowłosy"
    )

    delete_response = client.delete(
        f"/pets/{pet_id}",
        headers=headers,
    )

    assert delete_response.status_code in (200, 204)

    missing_response = client.get(
        f"/pets/{pet_id}",
        headers=headers,
    )

    assert missing_response.status_code == 404