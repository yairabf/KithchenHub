-- Initial schema from Prisma datamodel.
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "google_id" TEXT,
    "name" TEXT,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Member',
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "device_id" TEXT,
    "household_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shopping_lists" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shopping_items" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT,
    "is_checked" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prep_time" INTEGER,
    "ingredients" JSONB NOT NULL,
    "instructions" JSONB NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chores" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "assignee_id" UUID,
    "title" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "repeat" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "filename" TEXT,
    "source" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "import_mappings" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "source_field" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "target_field" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "import_mappings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
CREATE INDEX "users_household_id_idx" ON "users"("household_id");
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");
CREATE INDEX "shopping_lists_household_id_name_idx" ON "shopping_lists"("household_id", "name");
CREATE INDEX "shopping_items_list_id_idx" ON "shopping_items"("list_id");
CREATE INDEX "shopping_items_list_id_is_checked_idx" ON "shopping_items"("list_id", "is_checked");
CREATE INDEX "recipes_household_id_title_idx" ON "recipes"("household_id", "title");
CREATE INDEX "import_batches_user_id_idx" ON "import_batches"("user_id");
CREATE UNIQUE INDEX "import_mappings_batch_id_source_field_source_type_key" ON "import_mappings"("batch_id", "source_field", "source_type");
CREATE UNIQUE INDEX "import_mappings_user_id_source_field_source_type_key" ON "import_mappings"("user_id", "source_field", "source_type");

ALTER TABLE "users"
    ADD CONSTRAINT "users_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shopping_lists"
    ADD CONSTRAINT "shopping_lists_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shopping_items"
    ADD CONSTRAINT "shopping_items_list_id_fkey"
    FOREIGN KEY ("list_id") REFERENCES "shopping_lists"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recipes"
    ADD CONSTRAINT "recipes_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chores"
    ADD CONSTRAINT "chores_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chores"
    ADD CONSTRAINT "chores_assignee_id_fkey"
    FOREIGN KEY ("assignee_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "import_batches"
    ADD CONSTRAINT "import_batches_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "import_mappings"
    ADD CONSTRAINT "import_mappings_batch_id_fkey"
    FOREIGN KEY ("batch_id") REFERENCES "import_batches"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "import_mappings"
    ADD CONSTRAINT "import_mappings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
