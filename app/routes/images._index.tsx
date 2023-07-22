import type { V2_MetaFunction, LoaderArgs, ActionArgs } from "@remix-run/cloudflare";
import { redirect, unstable_createMemoryUploadHandler, unstable_parseMultipartFormData, json } from '@remix-run/cloudflare';
import type { InferModel } from 'drizzle-orm';
import { useLoaderData, useActionData } from "@remix-run/react";
import { createClient } from "~/db/client.server";
import { images, categories, tags } from '~/db/schema';
import invariant from 'tiny-invariant';
import { uuid } from '@cfworker/uuid';

export const meta: V2_MetaFunction = () => [
  { title: "New Remix App" },
  { name: "description", content: "Welcome to Remix!" },
];

type NewImage = InferModel<typeof images, 'insert'>;
export async function action({request, context}: ActionArgs) {
  try {
    const form = await unstable_parseMultipartFormData(request.clone(), 
      unstable_createMemoryUploadHandler({ maxPartSize: 1024 * 1024 * 10 }));

    const files = form.getAll('file');
    const name = form.get('name') as string;
    const categoryId = Number(form.get('category'));

    const uploadR2Promises = files.map(async (file) => {
      invariant(file, 'File is required');

      const fileName = `${uuid()}.${file.type.split('/')[1]}`;
      const bucket = (context.MY_BUCKET as R2Bucket);
      const response = await bucket.put(fileName, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      });

      return {
        key: response.key,
        name: name,
        createdAt: new Date(),
        updatedAt: new Date(),
        category_id: categoryId,
      }
    });

    const newImages: NewImage[] = await Promise.all(uploadR2Promises);

    for (let image of newImages) {
      const db = createClient(context.DB as D1Database);
      const d1Response = await db.insert(images).values(image).run();

      return json({object: d1Response});
    }
  } catch (error) {
    console.log(error)
    return new Response(error || 'Internal server error', { status: 500 });
  }
}

export const loader = async ({ context }: LoaderArgs) => {
  const db = createClient(context.DB as D1Database);
  const allCategories = await db.select().from(categories).all()
  const allTags = await db.select().from(tags).all()
  const allImages = await db.select().from(images).all()
  
  if (!allCategories && !allTags && !allImages) {
    throw new Response("Not Found", { status: 404 });
  }

  return { categories: allCategories, tags: allTags, images: allImages }
}

export type Images = InferModel<typeof images>;
export default function Images() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<{ catregory: Number, message: string; object: Images }>();
  console.log(data)
  console.log(actionData)

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Synca1 Admin</h1>
      <ul>
        <li><a href="/categories">カテゴリー</a></li>
        <li><a href="/tags">タグ</a></li>
      </ul>
      <form method="post" encType="multipart/form-data">
        <fieldset>
          <legend>画像のアップロード</legend>
          <div>
            <label htmlFor="name">画像のタイトル</label>
            <input name="name" type="text" />
          </div>
          <div>
            <input name="file" type="file" required multiple />
          </div>
          <div>
            <label htmlFor="category">カテゴリー選択（必須）</label>
            <select name="category">
              {data.categories.map((c)=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit">作成</button>
        </fieldset>
      </form>
    </div>
  );
}
