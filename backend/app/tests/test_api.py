import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.services import ProductService

# ==========================================
# SECURITY TESTS
# ==========================================
def test_password_hashing():
    password = "secret_wms_pass"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_token_creation_and_decoding():
    data = {"sub": "test@wms.com", "role": "ADMIN"}
    token = create_access_token(data)
    
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "test@wms.com"
    assert decoded["role"] == "ADMIN"
    assert decoded["type"] == "access"

def test_invalid_token():
    assert decode_token("invalid.token.string") is None

# ==========================================
# SERVICE UTILITIES TESTS
# ==========================================
class DummyModel:
    def __init__(self, name):
        self.name = name

def test_sku_generation_logic(monkeypatch):
    # Mock category and brand DB queries inside SKU generation
    class MockQuery:
        def __init__(self, model):
            self.model = model
        def get(self, id):
            return DummyModel("Shimlar" if self.model.__name__ == "Category" else "Nike")

    class MockDB:
        def query(self, model):
            return MockQuery(model)

    db = MockDB()
    
    # Mock product_variant_repo lookup to always return None (no SKU duplicates)
    monkeypatch.setattr("app.repositories.product_variant_repo.get_by_sku", lambda db, sku: None)

    sku = ProductService.generate_sku(db, category_id=1, brand_id=1, size="XL", color="Qora")
    assert sku.startswith("WMS-SHI-NIK-XL-QOR-")
    assert len(sku) == 23 # e.g. WMS-SHI-NIK-XL-QOR-1234
