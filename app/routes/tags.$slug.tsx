import type { V2_MetaFunction } from "@remix-run/cloudflare";
import { redirect } from '@remix-run/cloudflare';
import type { LoaderArgs, ActionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from "@remix-run/react";
import type { InferModel } from 'drizzle-orm';
import { createClient } from "~/db/client.server"
import { tags } from '~/db/schema';
import { eq } from "drizzle-orm";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

type NewTags = InferModel<typeof tags, 'insert'>;
export async function action({ params, request, context }: ActionArgs) {
  const tagId = params.slug
  const formData = await request.formData();
  const name = formData.get('name') as string;
  const newTag: NewTags = {
    name: name,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const db = createClient(context.DB as D1Database);
  await db.update(tags).set(newTag).where(eq(tags.id, tagId)).run();
  return redirect(`/tags/${tagId}`);
}

export const loader = async ({ params, context }: LoaderArgs) => {
  const db = createClient(context.DB as D1Database);
  const tagId = params.slug
  const tag = await db.select().from(tags).where(eq(tags.id, tagId)).all()
  if (!tag) {
    throw new Response("Not Found", {
      status: 404,
    });
  }
  return { tag: tag }
}

export default function TagSlug() {
  const data = useLoaderData<typeof loader>();
  const tagName = data.tag[0].name
  console.log(data)
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>{ tagName }</h1>
      <form method="post">
        <fieldset>
          <legend>{ tagName }の編集</legend>
          <div>
            <label htmlFor="name">タグ名</label>
            <input name="name" type="text" required />
          </div>

          <button type="submit">更新</button>
        </fieldset>
      </form>
    </div>
  );
}
