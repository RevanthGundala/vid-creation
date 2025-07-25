import yaml
from app import app

with open("openapi.yaml", "w") as f:
    yaml.dump(app.openapi(), f, sort_keys=False) 