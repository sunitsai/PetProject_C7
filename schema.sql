-- Database Schema (MySQL / PostgreSQL compatible with minor tweaks)

-- 1) Users table
CREATE TABLE users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, -- use AUTO_INCREMENT for MySQL
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- store hashed passwords in real systems
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2) Pets table (basic)
CREATE TABLE pets (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  owner_id BIGINT NOT NULL,
  name VARCHAR(120) NOT NULL,
  species VARCHAR(80) NOT NULL,
  age_years INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pets_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 3) Pet Details (1:1 or 1:N depending on design)
-- Here we use 1:1 extra details table to keep pets lean.
CREATE TABLE pet_details (
  pet_id BIGINT PRIMARY KEY,
  notes TEXT,
  favorite_food VARCHAR(120),
  microchip_id VARCHAR(120),
  last_checkup_date DATE,
  CONSTRAINT fk_details_pet FOREIGN KEY (pet_id) REFERENCES pets(id)
);

-- Example indexes
CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_pets_species ON pets(species);
