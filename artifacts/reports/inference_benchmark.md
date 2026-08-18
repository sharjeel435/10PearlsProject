# Inference benchmark

Benchmark date: 2026-08-18. Artifact size: 498,061,822 bytes.

Model load, single-forecast, three-city latency, and model memory could not be measured faithfully in the available Python 3.14 environment: it has scikit-learn 1.9.0, while the artifact was serialized with 1.5.2 and fails on the removed private `_RemainderColsList` type. No numbers are fabricated. Repeat on Python 3.12 after `pip install -r requirements-prod.txt`; record process RSS before/after `ModelLoader.load()` and time one and three predictions. Open-Meteo uses a 45-second request timeout, four bounded attempts, and exponential backoff.
