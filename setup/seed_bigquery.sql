CREATE SCHEMA IF NOT EXISTS demo_gemini;

CREATE OR REPLACE TABLE demo_gemini.daily_metrics AS
SELECT * FROM UNNEST([
  -- Nest Audio: HIGH CHURN (15%)
  STRUCT(DATE '2025-01-10' AS date, 'Nest Audio' AS device_type, 'new_user' AS cohort, 
         1200 AS active_users, 180 AS churned_users, 0.15 AS churn_rate),
  STRUCT(DATE '2025-01-11', 'Nest Audio', 'new_user', 1150, 172, 0.149),
  STRUCT(DATE '2025-01-12', 'Nest Audio', 'new_user', 1180, 177, 0.15),
  -- Nest Hub: Normal (5%)
  STRUCT(DATE '2025-01-10', 'Nest Hub', 'new_user', 2500, 125, 0.05),
  STRUCT(DATE '2025-01-11', 'Nest Hub', 'new_user', 2550, 127, 0.05),
  -- Pixel: Normal (5%)
  STRUCT(DATE '2025-01-10', 'Pixel', 'new_user', 5000, 250, 0.05),
  STRUCT(DATE '2025-01-11', 'Pixel', 'new_user', 5100, 255, 0.05)
]);

CREATE OR REPLACE TABLE demo_gemini.intent_performance AS
SELECT * FROM UNNEST([
  -- Nest Audio + Media: HIGH LATENCY (4500ms)
  STRUCT(DATE '2025-01-10' AS date, 'Nest Audio' AS device_type, 'Media' AS intent_category,
         5000 AS intent_count, 0.72 AS success_rate, 4500 AS avg_latency_ms),
  STRUCT(DATE '2025-01-11', 'Nest Audio', 'Media', 5200, 0.71, 4600),
  -- Nest Audio + Smart Home: Normal (800ms)
  STRUCT(DATE '2025-01-10', 'Nest Audio', 'Smart Home', 3000, 0.95, 800),
  -- Nest Hub: All normal
  STRUCT(DATE '2025-01-10', 'Nest Hub', 'Media', 8000, 0.92, 850),
  STRUCT(DATE '2025-01-10', 'Nest Hub', 'Smart Home', 5000, 0.96, 750),
  -- Pixel: All normal
  STRUCT(DATE '2025-01-10', 'Pixel', 'Media', 12000, 0.94, 600)
]);
