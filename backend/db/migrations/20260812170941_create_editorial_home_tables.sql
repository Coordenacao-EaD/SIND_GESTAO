-- migrate:up

CREATE TABLE app_users (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  status varchar(20) DEFAULT 'active' NOT NULL,
  created_at timestamptz(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT pk_app_users PRIMARY KEY (id),
  CONSTRAINT ck_app_users__status CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE site_home_banners (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title varchar(120) NOT NULL,
  subtitle varchar(160),
  body_text varchar(500) NOT NULL,
  image_url varchar(500),
  image_alt varchar(180),
  cta_enabled boolean DEFAULT false NOT NULL,
  cta_label varchar(80),
  cta_link_type varchar(20),
  cta_link_value varchar(500),
  status varchar(20) DEFAULT 'draft' NOT NULL,
  version_number integer DEFAULT 1 NOT NULL,
  published_at timestamptz(3),
  created_by uuid NOT NULL,
  updated_by uuid,
  created_at timestamptz(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT pk_site_home_banners PRIMARY KEY (id),
  CONSTRAINT fk_site_home_banners__app_users__created_by
    FOREIGN KEY (created_by) REFERENCES app_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_home_banners__app_users__updated_by
    FOREIGN KEY (updated_by) REFERENCES app_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_site_home_banners__status
    CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
  CONSTRAINT ck_site_home_banners__version_number CHECK (version_number > 0),
  CONSTRAINT ck_site_home_banners__title_length CHECK (char_length(btrim(title)) >= 3),
  CONSTRAINT ck_site_home_banners__body_text_length
    CHECK (char_length(btrim(body_text)) BETWEEN 10 AND 500),
  CONSTRAINT ck_site_home_banners__cta
    CHECK (
      (
        cta_enabled = false
        AND cta_label IS NULL
        AND cta_link_type IS NULL
        AND cta_link_value IS NULL
      )
      OR
      (
        cta_enabled = true
        AND cta_label IS NOT NULL
        AND char_length(btrim(cta_label)) >= 2
        AND cta_link_type IS NOT NULL
        AND cta_link_type IN ('internal', 'external')
        AND cta_link_value IS NOT NULL
        AND btrim(cta_link_value) <> ''
      )
    ),
  CONSTRAINT uq_site_home_banners__version_number UNIQUE (version_number)
);

CREATE UNIQUE INDEX ux_site_home_banners__published
  ON site_home_banners (status)
  WHERE status = 'published';
CREATE INDEX ix_site_home_banners__status_updated_at
  ON site_home_banners (status, updated_at);
CREATE INDEX ix_site_home_banners__published_at
  ON site_home_banners (published_at DESC);

CREATE TABLE site_public_contacts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  phone varchar(30),
  email varchar(254) NOT NULL,
  address varchar(255) NOT NULL,
  city varchar(100) NOT NULL,
  state char(2) DEFAULT 'MT' NOT NULL,
  postal_code varchar(9) NOT NULL,
  business_hours varchar(255),
  status varchar(20) DEFAULT 'draft' NOT NULL,
  version_number integer DEFAULT 1 NOT NULL,
  published_at timestamptz(3),
  created_by uuid NOT NULL,
  updated_by uuid,
  created_at timestamptz(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT pk_site_public_contacts PRIMARY KEY (id),
  CONSTRAINT fk_site_public_contacts__app_users__created_by
    FOREIGN KEY (created_by) REFERENCES app_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_public_contacts__app_users__updated_by
    FOREIGN KEY (updated_by) REFERENCES app_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_site_public_contacts__status
    CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
  CONSTRAINT ck_site_public_contacts__version_number CHECK (version_number > 0),
  CONSTRAINT ck_site_public_contacts__email_not_empty CHECK (btrim(email) <> ''),
  CONSTRAINT ck_site_public_contacts__address_length CHECK (char_length(btrim(address)) >= 3),
  CONSTRAINT ck_site_public_contacts__city_not_empty CHECK (btrim(city) <> ''),
  CONSTRAINT ck_site_public_contacts__state
    CHECK (
      state IN (
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
        'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
        'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
      )
    ),
  CONSTRAINT ck_site_public_contacts__postal_code
    CHECK (postal_code ~ '^([0-9]{8}|[0-9]{5}-[0-9]{3})$'),
  CONSTRAINT uq_site_public_contacts__version_number UNIQUE (version_number)
);

CREATE UNIQUE INDEX ux_site_public_contacts__published
  ON site_public_contacts (status)
  WHERE status = 'published';
CREATE INDEX ix_site_public_contacts__status_updated_at
  ON site_public_contacts (status, updated_at);
CREATE INDEX ix_site_public_contacts__published_at
  ON site_public_contacts (published_at DESC);

CREATE TABLE site_social_configurations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  status varchar(20) DEFAULT 'draft' NOT NULL,
  version_number integer DEFAULT 1 NOT NULL,
  submitted_at timestamptz(3),
  published_at timestamptz(3),
  archived_at timestamptz(3),
  created_by uuid NOT NULL,
  updated_by uuid,
  created_at timestamptz(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT pk_site_social_configurations PRIMARY KEY (id),
  CONSTRAINT fk_site_social_configurations__app_users__created_by
    FOREIGN KEY (created_by) REFERENCES app_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_social_configurations__app_users__updated_by
    FOREIGN KEY (updated_by) REFERENCES app_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_site_social_configurations__status
    CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
  CONSTRAINT ck_site_social_configurations__version_number CHECK (version_number > 0),
  CONSTRAINT ck_site_social_configurations__published_at
    CHECK (status <> 'published' OR published_at IS NOT NULL),
  CONSTRAINT ck_site_social_configurations__archived_at
    CHECK (status <> 'archived' OR archived_at IS NOT NULL),
  CONSTRAINT uq_site_social_configurations__version_number UNIQUE (version_number)
);

CREATE UNIQUE INDEX ux_site_social_configurations__published
  ON site_social_configurations (status)
  WHERE status = 'published';
CREATE INDEX ix_site_social_configurations__status_updated_at
  ON site_social_configurations (status, updated_at);
CREATE INDEX ix_site_social_configurations__published_at
  ON site_social_configurations (published_at DESC);

CREATE TABLE site_social_links (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  social_configuration_id uuid NOT NULL,
  platform varchar(30) NOT NULL,
  url varchar(500) NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_by uuid NOT NULL,
  updated_by uuid,
  created_at timestamptz(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at timestamptz(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT pk_site_social_links PRIMARY KEY (id),
  CONSTRAINT fk_site_social_links__social_config__social_config_id
    FOREIGN KEY (social_configuration_id) REFERENCES site_social_configurations (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_social_links__app_users__created_by
    FOREIGN KEY (created_by) REFERENCES app_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_site_social_links__app_users__updated_by
    FOREIGN KEY (updated_by) REFERENCES app_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_site_social_links__platform
    CHECK (platform IN ('facebook', 'instagram', 'youtube', 'linkedin', 'x')),
  CONSTRAINT ck_site_social_links__url_https CHECK (url LIKE 'https://%'),
  CONSTRAINT ck_site_social_links__display_order CHECK (display_order >= 0),
  CONSTRAINT uq_site_social_links__social_configuration_id_platform
    UNIQUE (social_configuration_id, platform)
);

CREATE INDEX ix_site_social_links__config_active_order_id
  ON site_social_links (social_configuration_id, is_active, display_order, id);
CREATE INDEX ix_site_social_links__is_active
  ON site_social_links (is_active);

-- migrate:down

DROP TABLE site_social_links;
DROP TABLE site_social_configurations;
DROP TABLE site_public_contacts;
DROP TABLE site_home_banners;
DROP TABLE app_users;
