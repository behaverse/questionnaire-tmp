import json
import secrets
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
from jwt.algorithms import OKPAlgorithm


def generate_keypair() -> tuple[str, dict, str]:
    """Return (kid, public_jwk, private_pem) for a fresh Ed25519 signing key."""
    kid = secrets.token_hex(8)
    priv = Ed25519PrivateKey.generate()
    private_pem = priv.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    # OKPAlgorithm.to_jwk on the public key yields {"kty","crv","x"} (no private scalar).
    pub_jwk = json.loads(OKPAlgorithm.to_jwk(priv.public_key()))
    pub_jwk.update({"kid": kid, "use": "sig", "alg": "EdDSA"})
    return kid, pub_jwk, private_pem
