import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
	images: many(images),
}));

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull(),
  name: text('name'),
  category_id: integer('category_id'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const imagesRelations = relations(images, ({ one, many }) => ({
	author: one(categories, {
		fields: [images.category_id],
		references: [categories.id],
	}),
  imagesToTags: many(imagesToTags),
}));

export const imagesToTags = sqliteTable('images_to_tags', {
	image_id: integer('image_id').notNull().references(() => images.id),
	tag_id: integer('tag_id').notNull().references(() => tags.id),
}, (table) => ({
    compositePk: primaryKey(table.image_id, table.tag_id),
  }),
);

export const imagesToTagsRelations = relations(imagesToTags, ({ one }) => ({
	tag: one(tags, {
		fields: [imagesToTags.tag_id],
		references: [tags.id],
	}),
	image: one(images, {
		fields: [imagesToTags.image_id],
		references: [images.id],
	}),
}));


export const tags = sqliteTable('tags', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name'),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});



export const tagsRelations = relations(tags, ({ many }) => ({
	imagesToTags: many(imagesToTags),
}));
