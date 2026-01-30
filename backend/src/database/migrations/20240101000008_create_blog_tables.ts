import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'blog_post_status'
          AND n.nspname = current_schema()
      ) THEN
        CREATE TYPE blog_post_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');
      END IF;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END$$;
  `);

  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'blog_comment_status'
          AND n.nspname = current_schema()
      ) THEN
        CREATE TYPE blog_comment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
      END IF;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END$$;
  `);

  await knex.schema.createTable('blog_posts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('author_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.string('slug').notNullable().unique();
    table.text('excerpt');
    table.text('content').notNullable();
    table.text('cover_image_url');
    table.specificType('status', 'blog_post_status').notNullable().defaultTo('DRAFT');
    table.timestamp('published_at');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('blog_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique();
    table.string('slug').notNullable().unique();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('blog_tags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique();
    table.string('slug').notNullable().unique();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('blog_post_categories', (table) => {
    table.uuid('post_id').notNullable().references('id').inTable('blog_posts').onDelete('CASCADE');
    table.uuid('category_id').notNullable().references('id').inTable('blog_categories').onDelete('CASCADE');
    table.primary(['post_id', 'category_id']);
  });

  await knex.schema.createTable('blog_post_tags', (table) => {
    table.uuid('post_id').notNullable().references('id').inTable('blog_posts').onDelete('CASCADE');
    table.uuid('tag_id').notNullable().references('id').inTable('blog_tags').onDelete('CASCADE');
    table.primary(['post_id', 'tag_id']);
  });

  await knex.schema.createTable('blog_comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('post_id').notNullable().references('id').inTable('blog_posts').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.specificType('status', 'blog_comment_status').notNullable().defaultTo('PENDING');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('blog_views', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('post_id').notNullable().references('id').inTable('blog_posts').onDelete('CASCADE');
    table.uuid('viewer_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('ip');
    table.text('user_agent');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('blog_views');
  await knex.schema.dropTableIfExists('blog_comments');
  await knex.schema.dropTableIfExists('blog_post_tags');
  await knex.schema.dropTableIfExists('blog_post_categories');
  await knex.schema.dropTableIfExists('blog_tags');
  await knex.schema.dropTableIfExists('blog_categories');
  await knex.schema.dropTableIfExists('blog_posts');

  await knex.raw('DROP TYPE IF EXISTS blog_comment_status');
  await knex.raw('DROP TYPE IF EXISTS blog_post_status');
}
