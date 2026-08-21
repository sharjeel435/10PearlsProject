"""Create and start a Hopsworks deployment for the latest registered RF model."""

from __future__ import annotations

from pathlib import Path

from src.feature_store.hopsworks_connection import connect


DEPLOYMENT_NAME = "aqirandomforest"
MODEL_NAME = "aqi_random_forest"
ENVIRONMENT_NAME = "aqi-serving-15"


def main():
    project = connect()
    registry = project.get_model_registry()
    serving = project.get_model_serving()
    models = registry.get_models(MODEL_NAME)
    if not models:
        raise RuntimeError(f"No registered model found: {MODEL_NAME}")
    model = max(models, key=lambda item: int(item.version))
    script = Path(__file__).with_name("hopsworks_predictor.py").resolve()
    dataset_api = project.get_dataset_api()
    script_directory = "Resources/aqi-serving"
    if not dataset_api.exists(script_directory):
        dataset_api.mkdir(script_directory)
    uploaded_script = dataset_api.upload(
        str(script), script_directory, overwrite=True
    )
    remote_script = f"/Projects/{project.name}/{uploaded_script}"
    existing = {deployment.name: deployment for deployment in serving.get_deployments()}
    if DEPLOYMENT_NAME in existing:
        deployment = existing[DEPLOYMENT_NAME]
        deployment.predictor.script_file = remote_script
        deployment.predictor.environment = ENVIRONMENT_NAME
        deployment.save()
        deployment.start(await_running=600)
        print(f"Updated deployment: {deployment.name}")
        print(f"State: {deployment.get_state()}")
        return
    deployment = model.deploy(
        name=DEPLOYMENT_NAME,
        description="Pearls AQI 24h, 48h, and 72h Random Forest forecasts",
        script_file=remote_script,
        environment=ENVIRONMENT_NAME,
    )
    deployment.start(await_running=600)
    print(f"Deployment: {deployment.name}")
    print(f"Model: {model.name} v{model.version}")
    print(f"State: {deployment.get_state()}")


if __name__ == "__main__":
    main()
