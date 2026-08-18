from pathlib import Path
import json

import matplotlib.pyplot as plt
import pandas as pd


def explain_random_forest(pipeline, sample: pd.DataFrame, output_dir: Path, max_rows: int = 1000):
    try:
        import shap
    except ImportError as exc:
        raise RuntimeError("Install the 'explain' extra for SHAP analysis") from exc
    output_dir.mkdir(parents=True, exist_ok=True)
    transformed = pipeline.named_steps["preprocessor"].transform(sample.iloc[:max_rows])
    names = pipeline.named_steps["preprocessor"].get_feature_names_out()
    explainer = shap.TreeExplainer(pipeline.named_steps["model"])
    values = explainer(transformed)
    
    horizons = ["24h", "48h", "72h"]
    all_importance = []
    for i, horizon in enumerate(horizons):
        shap.summary_plot(values[..., i], transformed, feature_names=names, show=False, max_display=25)
        plt.tight_layout(); plt.savefig(output_dir / f"random_forest_shap_{horizon}.png", dpi=160); plt.close()
        importance = pd.DataFrame({"feature": names, f"mean_abs_shap_{horizon}": abs(values.values[..., i]).mean(axis=0)})
        all_importance.append(importance.set_index("feature"))

    combined_importance = pd.concat(all_importance, axis=1)
    combined_importance.to_csv(output_dir / "top_features.csv")
    
    first = values.values[0, :, 0]
    order = abs(first).argsort()[::-1][:20]
    explanation = {"prediction_output": "24h", "base_value": float(values.base_values[0, 0]),
                   "top_contributors": [{"feature": str(names[i]), "shap_value": float(first[i])} for i in order]}
    (output_dir / "individual_explanation.json").write_text(json.dumps(explanation, indent=2), encoding="utf-8")
    return combined_importance.sort_values(f"mean_abs_shap_{horizons[0]}", ascending=False)
