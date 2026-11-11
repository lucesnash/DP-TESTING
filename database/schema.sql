-- Suggested tables for the Smart Expressive Communication Band companion app (PostgreSQL style).
-- Privacy: no raw sensor data and no message text are stored. Caregivers read anonymized summaries only (RA 10173).

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,                 -- bcrypt or argon2, hashed on the server
  role          TEXT NOT NULL DEFAULT 'signer' CHECK (role IN ('signer','partner','caregiver')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE devices (                          -- one row per glove
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  side        TEXT NOT NULL CHECK (side IN ('left_spoke','right_hub')),
  ble_name    TEXT,                            -- e.g. SECB-Hub-R (hub only)
  firmware    TEXT,
  paired_at   TIMESTAMPTZ
);

CREATE TABLE profiles (                         -- PUT /profile
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  paired         BOOLEAN NOT NULL DEFAULT FALSE,
  calibrated     BOOLEAN NOT NULL DEFAULT FALSE,
  voice_cal      BOOLEAN NOT NULL DEFAULT FALSE,
  model_version  TEXT NOT NULL DEFAULT '1.3',
  conf_threshold INT  NOT NULL DEFAULT 70,     -- percent
  hold_seconds   NUMERIC(3,1) NOT NULL DEFAULT 0.6,
  speed          INT  NOT NULL DEFAULT 50,
  settings       JSONB NOT NULL DEFAULT '{}'   -- text size, tts rate, tone sensitivity, ...
);

CREATE TABLE calibration_profiles (             -- POST /calibration
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flex_range JSONB,                            -- per finger open/fist %
  imu_offset JSONB,
  hand_gains JSONB,
  accuracy   NUMERIC(4,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gesture_corrections (              -- POST /corrections
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  heard_label  TEXT NOT NULL,
  correct_label TEXT,                          -- NULL when the signer confirmed the guess
  confidence   NUMERIC(4,1),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE session_summaries (                -- feeds GET /analytics
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at  TIMESTAMPTZ NOT NULL,
  minutes     INT,
  signs       INT,
  accuracy    NUMERIC(4,1),
  avg_conf    NUMERIC(4,1),
  latency_s   NUMERIC(3,1),
  corrections INT
);

CREATE TABLE sign_stats (                       -- per-sign accuracy and confusion pairs, aggregated
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  attempts   INT NOT NULL DEFAULT 0,
  correct    INT NOT NULL DEFAULT 0,
  confused_with JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, label)
);
