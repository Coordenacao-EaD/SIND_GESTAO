-- migrate:up

CREATE TABLE site_home_reviews (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  content_type varchar(30) NOT NULL,
  banner_id uuid,
  contacts_id uuid,
  social_configuration_id uuid,
  content_id uuid GENERATED ALWAYS AS (
    COALESCE(banner_id, contacts_id, social_configuration_id)
  ) STORED,
  cycle_number integer DEFAULT 1 NOT NULL,
  content_version integer NOT NULL,
  submitted_content_hash varchar(128) NOT NULL,
  decision varchar(30) DEFAULT 'pending' NOT NULL,
  submitted_by uuid NOT NULL,
  submitted_at timestamptz(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamptz(3),
  review_notes varchar(1000),
  invalidated_by uuid,
  invalidated_at timestamptz(3),
  invalidation_reason varchar(1000),
  CONSTRAINT pk_site_home_reviews PRIMARY KEY (id),
  CONSTRAINT fk_site_home_reviews__banners__banner_id
    FOREIGN KEY (banner_id) REFERENCES site_home_banners (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_home_reviews__contacts__contacts_id
    FOREIGN KEY (contacts_id) REFERENCES site_public_contacts (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_home_reviews__social_config__social_config_id
    FOREIGN KEY (social_configuration_id) REFERENCES site_social_configurations (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_home_reviews__app_users__submitted_by
    FOREIGN KEY (submitted_by) REFERENCES app_users (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_home_reviews__app_users__reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES app_users (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_home_reviews__app_users__invalidated_by
    FOREIGN KEY (invalidated_by) REFERENCES app_users (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_site_home_reviews__content_type
    CHECK (content_type IN ('banner', 'contacts', 'social_configuration')),
  CONSTRAINT ck_site_home_reviews__one_content_target
    CHECK (num_nonnulls(banner_id, contacts_id, social_configuration_id) = 1),
  CONSTRAINT ck_site_home_reviews__content_type_target
    CHECK (
      (content_type = 'banner' AND banner_id IS NOT NULL
        AND contacts_id IS NULL AND social_configuration_id IS NULL)
      OR
      (content_type = 'contacts' AND contacts_id IS NOT NULL
        AND banner_id IS NULL AND social_configuration_id IS NULL)
      OR
      (content_type = 'social_configuration' AND social_configuration_id IS NOT NULL
        AND banner_id IS NULL AND contacts_id IS NULL)
    ),
  CONSTRAINT ck_site_home_reviews__cycle_number CHECK (cycle_number > 0),
  CONSTRAINT ck_site_home_reviews__content_version CHECK (content_version > 0),
  CONSTRAINT ck_site_home_reviews__submitted_content_hash
    CHECK (btrim(submitted_content_hash) <> ''),
  CONSTRAINT ck_site_home_reviews__decision
    CHECK (
      decision IN ('pending', 'approved', 'changes_requested', 'cancelled', 'invalidated')
    ),
  CONSTRAINT ck_site_home_reviews__decision_consistency
    CHECK (
      (
        decision = 'pending'
        AND reviewed_by IS NULL
        AND reviewed_at IS NULL
        AND review_notes IS NULL
        AND invalidated_by IS NULL
        AND invalidated_at IS NULL
        AND invalidation_reason IS NULL
      )
      OR
      (
        decision = 'approved'
        AND reviewed_by IS NOT NULL
        AND reviewed_at IS NOT NULL
        AND reviewed_by <> submitted_by
        AND invalidated_by IS NULL
        AND invalidated_at IS NULL
        AND invalidation_reason IS NULL
      )
      OR
      (
        decision IN ('changes_requested', 'cancelled')
        AND reviewed_by IS NOT NULL
        AND reviewed_at IS NOT NULL
        AND review_notes IS NOT NULL
        AND char_length(btrim(review_notes)) BETWEEN 10 AND 1000
        AND invalidated_by IS NULL
        AND invalidated_at IS NULL
        AND invalidation_reason IS NULL
      )
      OR
      (
        decision = 'invalidated'
        AND invalidated_at IS NOT NULL
        AND invalidation_reason IS NOT NULL
        AND btrim(invalidation_reason) <> ''
        AND (
          (reviewed_by IS NULL AND reviewed_at IS NULL)
          OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
        )
      )
    ),
  CONSTRAINT uq_site_home_reviews__content_cycle
    UNIQUE (content_type, content_id, cycle_number)
);

CREATE UNIQUE INDEX ux_site_home_reviews__pending
  ON site_home_reviews (content_type, content_id)
  WHERE decision = 'pending';
CREATE INDEX ix_site_home_reviews__decision_submitted_type
  ON site_home_reviews (decision, submitted_at, content_type);
CREATE INDEX ix_site_home_reviews__content_cycle_desc
  ON site_home_reviews (content_type, content_id, cycle_number DESC);
CREATE INDEX ix_site_home_reviews__reviewer_reviewed_at
  ON site_home_reviews (reviewed_by, reviewed_at DESC);

CREATE TABLE site_home_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  banner_id uuid NOT NULL,
  contacts_id uuid NOT NULL,
  social_configuration_id uuid,
  version_number integer DEFAULT 1 NOT NULL,
  snapshot_json jsonb NOT NULL,
  change_summary varchar(500) NOT NULL,
  published_at timestamptz(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  is_current boolean DEFAULT false NOT NULL,
  created_by uuid NOT NULL,
  CONSTRAINT pk_site_home_versions PRIMARY KEY (id),
  CONSTRAINT fk_site_home_versions__banners__banner_id
    FOREIGN KEY (banner_id) REFERENCES site_home_banners (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_home_versions__contacts__contacts_id
    FOREIGN KEY (contacts_id) REFERENCES site_public_contacts (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_home_versions__social_config__social_config_id
    FOREIGN KEY (social_configuration_id) REFERENCES site_social_configurations (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_home_versions__app_users__created_by
    FOREIGN KEY (created_by) REFERENCES app_users (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_site_home_versions__version_number CHECK (version_number > 0),
  CONSTRAINT ck_site_home_versions__snapshot_object
    CHECK (jsonb_typeof(snapshot_json) = 'object'),
  CONSTRAINT ck_site_home_versions__change_summary
    CHECK (char_length(btrim(change_summary)) BETWEEN 10 AND 500),
  CONSTRAINT uq_site_home_versions__version_number UNIQUE (version_number)
);

CREATE UNIQUE INDEX ux_site_home_versions__current
  ON site_home_versions (is_current)
  WHERE is_current = true;
CREATE INDEX ix_site_home_versions__published_at
  ON site_home_versions (published_at DESC);
CREATE INDEX ix_site_home_versions__content_references
  ON site_home_versions (banner_id, contacts_id, social_configuration_id);

CREATE FUNCTION prevent_site_home_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'site_home_versions rows are append-only'
      USING ERRCODE = '23514', CONSTRAINT = 'ck_site_home_versions__append_only';
  END IF;

  IF OLD.is_current = true
     AND NEW.is_current = false
     AND NEW.id IS NOT DISTINCT FROM OLD.id
     AND NEW.banner_id IS NOT DISTINCT FROM OLD.banner_id
     AND NEW.contacts_id IS NOT DISTINCT FROM OLD.contacts_id
     AND NEW.social_configuration_id IS NOT DISTINCT FROM OLD.social_configuration_id
     AND NEW.version_number IS NOT DISTINCT FROM OLD.version_number
     AND NEW.snapshot_json IS NOT DISTINCT FROM OLD.snapshot_json
     AND NEW.change_summary IS NOT DISTINCT FROM OLD.change_summary
     AND NEW.published_at IS NOT DISTINCT FROM OLD.published_at
     AND NEW.created_by IS NOT DISTINCT FROM OLD.created_by THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'site_home_versions rows are immutable except for true to false is_current'
    USING ERRCODE = '23514', CONSTRAINT = 'ck_site_home_versions__immutable';
END;
$$;

CREATE TRIGGER tr_site_home_versions__prevent_mutation
BEFORE UPDATE OR DELETE ON site_home_versions
FOR EACH ROW
EXECUTE FUNCTION prevent_site_home_version_mutation();

-- migrate:down

DROP TRIGGER tr_site_home_versions__prevent_mutation ON site_home_versions;
DROP FUNCTION prevent_site_home_version_mutation();
DROP TABLE site_home_reviews;
DROP TABLE site_home_versions;
